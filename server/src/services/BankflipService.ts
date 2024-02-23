import { inject, injectable } from "inversify";
import { RequestInit } from "node-fetch";
import { isDefined } from "remeda";
import { CONFIG, Config } from "../config";
import { FeatureFlagRepository } from "../db/repositories/FeatureFlagRepository";
import { FileRepository } from "../db/repositories/FileRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { getBaseWebhookUrl } from "../util/getBaseWebhookUrl";
import { fromGlobalId } from "../util/globalId";
import { Maybe } from "../util/types";
import { FETCH_SERVICE, IFetchService } from "./FetchService";
import { IImageService, IMAGE_SERVICE } from "./ImageService";

export type SessionMetadata = {
  petitionId: string;
  fieldId: string;
  orgId: string;
  parentReplyId?: string | null;
} & ({ userId: string } | { accessId: string });

/** When the Session is completed. (every requested model has been extracted) */
export interface BankflipWebhookEvent {
  name: string;
  payload: {
    sessionId: string;
  };
}

export interface ModelRequest {
  type: string;
  year?: number;
  month?: "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "11" | "12";
  quarter?: "Q1" | "Q2" | "Q3" | "Q4";
  licensePlate?: string;
}

export interface ModelRequestDocument {
  contentType: string;
  createdAt: string;
  extension: string;
  id: string;
  model: ModelRequest;
  name: string;
  sessionId: string;
}

interface CreateSessionResponse {
  id: string;
  widgetLink: string;
}

interface NoDocumentReason {
  reason: string;
  subreason: Maybe<string>;
}

export interface ModelRequestOutcome {
  completed: boolean;
  documents: Maybe<ModelRequestDocument[]>;
  modelRequest: { model: ModelRequest };
  noDocumentReasons: Maybe<NoDocumentReason[]>;
}

interface IdentityVerificationDocumentInfo {
  id: string;
  sessionId: string;
  extension: string;
  name: string;
  contentType: string;
  createdAt: string;
}

interface IdentityVerificationDocument {
  type: "id_card" | "passport" | "residence_permit" | "driver_license";
  country: string;
  frontPictureDocument: Maybe<IdentityVerificationDocumentInfo>;
  backPictureDocument: Maybe<IdentityVerificationDocumentInfo>;
  dataDocument: Maybe<IdentityVerificationDocumentInfo>;
  imagesDocument: Maybe<IdentityVerificationDocumentInfo>;
}

export interface IdentityVerification {
  id: Maybe<string>;
  createdAt: Maybe<string>;
  state: "ok" | "ko";
  koReason:
    | "generic"
    | "user_aborted"
    | "manually_rejected"
    | "attempts_exceeded"
    | "user_blocked"
    | null;
  koSubreason:
    | "user_aborted_before_start"
    | "user_aborted_during_process"
    | "user_aborted_after_error"
    | "user_blocked_expired_document"
    | "user_blocked_underage"
    | null;
  documents: IdentityVerificationDocument[];
}

export interface SessionSummaryResponse {
  modelRequestOutcomes: ModelRequestOutcome[];
  identityVerification: Maybe<IdentityVerification>;
}

interface SessionResponse {
  id: string;
  metadata: SessionMetadata;
}

export const BANKFLIP_SERVICE = Symbol.for("BANKFLIP_SERVICE");

export interface IBankflipService {
  /** called to start a session with Bankflip to request a person's documents */
  createSession(metadata: SessionMetadata): Promise<CreateSessionResponse>;
  /** creates a 'retry' session, picking from the field only the model requests that resulted on an error */
  createRetrySession(metadata: SessionMetadata): Promise<CreateSessionResponse>;
  /** webhook callback for when document extraction has finished and the session is completed */
  webhookSecret(orgId: string): string;
  fetchSessionMetadata(orgId: string, sessionId: string): Promise<SessionMetadata>;
  fetchSessionSummary(orgId: string, sessionId: string): Promise<SessionSummaryResponse>;
  fetchBinaryDocumentContents(orgId: string, documentId: string): Promise<Buffer>;
  fetchJsonDocumentContents(orgId: string, documentId: string): Promise<any>;
}

@injectable()
export class BankflipService implements IBankflipService {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(FileRepository) private files: FileRepository,
    @inject(FeatureFlagRepository) private featureFlags: FeatureFlagRepository,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(IMAGE_SERVICE) private images: IImageService,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(CONFIG) private config: Config,
  ) {}

  webhookSecret(orgId: string) {
    switch (orgId) {
      case this.config.bankflip.saldadosOrgId:
        return this.config.bankflip.saldadosWebhookSecret;
      case this.config.bankflip.debifyOrgId:
        return this.config.bankflip.debifyWebhookSecret;
      case this.config.bankflip.mundimotoOrgId:
        return this.config.bankflip.mundimotoWebhookSecret;
      default:
        return this.config.bankflip.webhookSecret;
    }
  }

  private bankflipHost(orgId: string) {
    switch (orgId) {
      case this.config.bankflip.saldadosOrgId:
        return this.config.bankflip.saldadosHost;
      case this.config.bankflip.debifyOrgId:
        return this.config.bankflip.debifyHost;
      case this.config.bankflip.mundimotoOrgId:
        return this.config.bankflip.mundimotoHost;
      default:
        return this.config.bankflip.host;
    }
  }

  private bankflipApiKey(orgId: string) {
    switch (orgId) {
      case this.config.bankflip.saldadosOrgId:
        return this.config.bankflip.saldadosApiKey;
      case this.config.bankflip.debifyOrgId:
        return this.config.bankflip.debifyApiKey;
      case this.config.bankflip.mundimotoOrgId:
        return this.config.bankflip.mundimotoApiKey;
      default:
        return this.config.bankflip.apiKey;
    }
  }

  private async apiRequest<T>(
    orgId: string,
    url: string,
    init?: RequestInit,
    type: "json" | "buffer" = "json",
  ): Promise<T> {
    const host = this.bankflipHost(orgId);
    const apiKey = this.bankflipApiKey(orgId);
    const response = await this.fetch.fetch(`${host}${url}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      ...init,
    });

    return await response[type]();
  }

  async createSession(metadata: SessionMetadata) {
    const baseWebhookUrl = await getBaseWebhookUrl(this.config.misc.webhooksUrl);
    const fieldId = fromGlobalId(metadata.fieldId, "PetitionField").id;
    const field = await this.petitions.loadField(fieldId);

    const orgId = fromGlobalId(metadata.orgId, "Organization").id;
    const customization = await this.buildBankflipCustomization(orgId);

    return await this.apiRequest<CreateSessionResponse>(metadata.orgId, "/session", {
      method: "POST",
      body: JSON.stringify({
        requests: field?.options.requests ?? [],
        webhookUrl: `${baseWebhookUrl}/api/webhooks/bankflip/v2/${metadata.orgId}`,
        customization,
        metadata,
        identityVerification: field?.options.identityVerification ?? null,
      }),
    });
  }

  async createRetrySession(metadata: SessionMetadata) {
    const baseWebhookUrl = await getBaseWebhookUrl(this.config.misc.webhooksUrl);
    const fieldId = fromGlobalId(metadata.fieldId, "PetitionField").id;
    const parentReplyId = metadata.parentReplyId
      ? fromGlobalId(metadata.parentReplyId, "PetitionFieldReply").id
      : null;
    const field = await this.petitions.loadField(fieldId);

    const fieldReplies = (await this.petitions.loadRepliesForField(fieldId)).filter(
      (r) => r.parent_petition_field_reply_id === parentReplyId && r.status !== "APPROVED",
    );

    // filter model-request replies that have been successful or have document_not_found error
    const successfulModelRequestReplies = fieldReplies
      .filter((r) => !isDefined(r.content.type) || r.content.type === "model-request")
      .filter(
        (r) =>
          !isDefined(r.content.error) ||
          (Array.isArray(r.content.error) && r.content.error[0]?.reason === "document_not_found"),
      );

    // on original configured model requests, get only those that don't have a successful reply with the same request
    const requests = (field?.options.requests ?? []).filter(
      (request: any) =>
        !successfulModelRequestReplies
          .map((r) => JSON.stringify(r.content.request.model))
          .includes(JSON.stringify(request.model)),
    );

    const successfulIdentityVerificationReply = fieldReplies.find(
      (r) => r.content.type === "identity-verification" && !isDefined(r.content.error),
    );

    // if identity-verification was configured and there's no successful reply, retry with the same configuration
    const identityVerification =
      isDefined(field?.options.identityVerification) &&
      !isDefined(successfulIdentityVerificationReply)
        ? field!.options.identityVerification
        : null;

    const orgId = fromGlobalId(metadata.orgId, "Organization").id;
    const customization = await this.buildBankflipCustomization(orgId);

    return await this.apiRequest<CreateSessionResponse>(metadata.orgId, "/session", {
      method: "POST",
      body: JSON.stringify({
        requests,
        webhookUrl: `${baseWebhookUrl}/api/webhooks/bankflip/v2/${metadata.orgId}?retry=true`,
        customization,
        metadata,
        identityVerification,
      }),
    });
  }

  async fetchSessionMetadata(orgId: string, sessionId: string) {
    const session = await this.apiRequest<SessionResponse>(orgId, `/session/${sessionId}`);
    return session.metadata;
  }

  async fetchSessionSummary(orgId: string, sessionId: string) {
    return await this.apiRequest<SessionSummaryResponse>(orgId, `/session/${sessionId}/summary`);
  }

  async fetchBinaryDocumentContents(orgId: string, documentId: string) {
    return await this.apiRequest<Buffer>(orgId, `/document/${documentId}/content`, {}, "buffer");
  }

  async fetchJsonDocumentContents(orgId: string, documentId: string) {
    return await this.apiRequest<any>(orgId, `/document/${documentId}/content`);
  }

  private async buildBankflipCustomization(orgId: number) {
    const organization = await this.organizations.loadOrg(orgId);
    const hasRemoveParallelBranding = await this.featureFlags.orgHasFeatureFlag(
      orgId,
      "REMOVE_PARALLEL_BRANDING",
    );

    const customization: any = {};
    if (hasRemoveParallelBranding) {
      customization["companyName"] = organization!.name;
      const customLogoPath = await this.organizations.loadOrgIconPath(organization!.id);
      if (isDefined(customLogoPath)) {
        customization["companyLogo"] = await this.images.getImageUrl(customLogoPath, {
          resize: { height: 150, width: 150, fit: "fill" },
        });
      }
    }

    return customization;
  }
}
