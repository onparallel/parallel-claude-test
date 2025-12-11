import { inject, injectable } from "inversify";
import { isNonNullish, isNullish } from "remeda";
import { CONFIG, Config } from "../config";
import { ContactLocale } from "../db/__types";
import { FeatureFlagRepository } from "../db/repositories/FeatureFlagRepository";
import { FileRepository } from "../db/repositories/FileRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { InvalidRequestError } from "../integrations/helpers/GenericIntegration";
import { getBaseWebhookUrl } from "../util/getBaseWebhookUrl";
import { fromGlobalId } from "../util/globalId";
import { retry, StopRetryError } from "../util/retry";
import { Maybe } from "../util/types";
import { FETCH_SERVICE, IFetchService } from "./FetchService";
import { IImageService, IMAGE_SERVICE } from "./ImageService";
import { ILogger, LOGGER } from "./Logger";

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
  dataDocument: Maybe<IdentityVerificationDocumentInfo>;
  imagesDocument: Maybe<IdentityVerificationDocumentInfo>;
  idNumber: Maybe<string>; // ID of document's holder
  number: Maybe<string>; // ID of the document itself
  firstName: Maybe<string>;
  surname: Maybe<string>;
  birthDate: Maybe<string>;
  birthPlace: Maybe<string>;
  nationality: Maybe<string>;
  issueDate: Maybe<string>;
  expirationDate: Maybe<string>;
  unexpiredDocument: Maybe<number>;
  faceFrontSide: Maybe<number>;
  uncompromisedDocument: Maybe<number>;
  notShownScreen: Maybe<number>;
  checkedMRZ: Maybe<number>;
  issuingCountry: Maybe<string>;
  documentSecurity: Maybe<boolean>;
  documentRead: Maybe<boolean>;
  notForged: Maybe<number>;
  notPrinted: Maybe<number>;
  notSyntheticDocument: Maybe<number>;
  createdAt: string;
}

interface IdentityVerification {
  id: string | null;
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
}

export interface SessionSummaryResponse {
  modelRequestOutcomes: ModelRequestOutcome[];
  identityVerification: Maybe<IdentityVerification>;
}

interface IdentityVerificationSummaryResponse {
  id: string;
  createdAt: Maybe<string>;
  firstName: Maybe<string>;
  surname: Maybe<string>;
  birthDate: Maybe<string>;
  nationality: Maybe<string>;
  birthPlace: Maybe<string>;
  documents: Maybe<IdentityVerificationDocument[]>;
  selfie: Maybe<{
    pictureDocument: Maybe<IdentityVerificationDocumentInfo>;
    videoDocument: Maybe<IdentityVerificationDocumentInfo>;
    createdAt: string;
    liveness: Maybe<number>;
  }>;
}
interface SessionResponse {
  id: string;
  metadata: SessionMetadata;
}

export const BANKFLIP_SERVICE = Symbol.for("BANKFLIP_SERVICE");

export interface IBankflipService {
  /** called to start a session with Bankflip to request a person's documents */
  createSession(metadata: SessionMetadata, locale: ContactLocale): Promise<CreateSessionResponse>;
  /** creates a 'retry' session, picking from the field only the model requests that resulted on an error */
  createRetrySession(
    metadata: SessionMetadata,
    locale: ContactLocale,
  ): Promise<CreateSessionResponse>;
  /** webhook callback for when document extraction has finished and the session is completed */
  webhookSecret(orgId: string): string;
  fetchSessionMetadata(orgId: string, sessionId: string): Promise<SessionMetadata>;
  fetchSessionSummary(orgId: string, sessionId: string): Promise<SessionSummaryResponse>;
  fetchIdVerificationSummary(
    orgId: string,
    idVerificationId: string,
  ): Promise<IdentityVerificationSummaryResponse>;
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
    @inject(LOGGER) private logger: ILogger,
  ) {}

  webhookSecret(orgId: string) {
    switch (orgId) {
      case this.config.bankflip.saldadosOrgId:
        return this.config.bankflip.saldadosWebhookSecret;
      case this.config.bankflip.debifyOrgId:
        return this.config.bankflip.debifyWebhookSecret;
      case this.config.bankflip.mundimotoOrgId:
        return this.config.bankflip.mundimotoWebhookSecret;
      case this.config.bankflip.lexidyOrgId:
        return this.config.bankflip.lexidyWebhookSecret;
      case this.config.bankflip.asobanOrgId:
        return this.config.bankflip.asobanWebhookSecret;
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
      case this.config.bankflip.lexidyOrgId:
        return this.config.bankflip.lexidyHost;
      case this.config.bankflip.asobanOrgId:
        return this.config.bankflip.asobanHost;
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
      case this.config.bankflip.lexidyOrgId:
        return this.config.bankflip.lexidyApiKey;
      case this.config.bankflip.asobanOrgId:
        return this.config.bankflip.asobanApiKey;
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

    if (!response.ok) {
      if (response.status === 400) {
        const data = await response.json();
        if (data.code === "VALIDATION_ERROR") {
          throw new InvalidRequestError("VALIDATION_ERROR", data.message);
        }
      }

      throw new Error(`${response.status} ${response.statusText}`);
    }
    if (type === "json") {
      return await response.json();
    } else {
      return Buffer.from(await response.arrayBuffer()) as T;
    }
  }

  private mapContactLocaleToBankflip(locale: ContactLocale) {
    // Bankflip does not support italian locale
    if (locale === "it") return "en";
    return locale;
  }

  async createSession(metadata: SessionMetadata, locale: ContactLocale) {
    const baseWebhookUrl = await getBaseWebhookUrl(this.config.misc.webhooksUrl);
    const fieldId = fromGlobalId(metadata.fieldId, "PetitionField").id;
    const field = await this.petitions.loadField(fieldId);

    const orgId = fromGlobalId(metadata.orgId, "Organization").id;
    const customization = await this.buildBankflipCustomization(orgId);

    return await retry(
      async (i) => {
        try {
          return await this.apiRequest<CreateSessionResponse>(metadata.orgId, "/session", {
            method: "POST",
            body: JSON.stringify({
              requests: field?.options.requests ?? [],
              webhookUrl: `${baseWebhookUrl}/api/webhooks/bankflip/v2/${metadata.orgId}`,
              customization,
              metadata,
              identityVerification: field?.options.identityVerification ?? null,
              ...(i === 0 ? { locale: this.mapContactLocaleToBankflip(locale) } : {}),
            }),
          });
        } catch (error) {
          if (error instanceof InvalidRequestError && error.code === "VALIDATION_ERROR") {
            // Bankflip returns 400 with VALIDATION_ERROR when requested locale is not enabled in the account
            // in this case, we want to retry the request without passing locale param (defaults to "es").
            // log as error so we can be aware of this
            this.logger.error(
              `Organization:${orgId} BankflipService validation error: ${error.message}. Will retry request without locale param.`,
            );
            throw error;
          }
          // any other error, we don't want to retry
          throw new StopRetryError(error);
        }
      },
      { maxRetries: 1 },
    );
  }

  async createRetrySession(metadata: SessionMetadata, locale: ContactLocale) {
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
      .filter((r) => isNullish(r.content.type) || r.content.type === "model-request")
      .filter(
        (r) =>
          (isNullish(r.content.error) ||
            (Array.isArray(r.content.error) &&
              r.content.error[0]?.reason === "document_not_found")) &&
          isNullish(r.content.warning),
      );

    // on original configured model requests, get only those that don't have a successful reply with the same request
    const requests = (field?.options.requests ?? []).filter((request: any) => {
      return !successfulModelRequestReplies.find((r) => {
        const replyModel = r.content.request.model;
        return (
          request.model.type === replyModel.type &&
          // request configured in petition field may not have the following params,
          // but the reply content may have them (automatically added by Bankflip response)
          // e.g. AEAT_IRPF_DATOS_FISCALES model request without a year, last year added in the reply
          (isNullish(request.model.year) || request.model.year === replyModel.year) &&
          (isNullish(request.model.month) || request.model.month === replyModel.month) &&
          (isNullish(request.model.quarter) || request.model.quarter === replyModel.quarter) &&
          (isNullish(request.model.licensePlate) ||
            request.model.licensePlate === replyModel.licensePlate)
        );
      });
    });

    const successfulIdentityVerificationReply = fieldReplies.find(
      (r) => r.content.type === "identity-verification" && isNullish(r.content.error),
    );

    // if identity-verification was configured and there's no successful reply, retry with the same configuration
    const identityVerification =
      isNonNullish(field?.options.identityVerification) &&
      isNullish(successfulIdentityVerificationReply)
        ? field!.options.identityVerification
        : null;

    if (requests.length === 0 && !identityVerification) {
      throw new Error("NOTHING_TO_RETRY");
    }

    const orgId = fromGlobalId(metadata.orgId, "Organization").id;
    const customization = await this.buildBankflipCustomization(orgId);

    return await retry(
      async (i) => {
        try {
          return await this.apiRequest<CreateSessionResponse>(metadata.orgId, "/session", {
            method: "POST",
            body: JSON.stringify({
              requests,
              webhookUrl: `${baseWebhookUrl}/api/webhooks/bankflip/v2/${metadata.orgId}?retry=true`,
              customization,
              metadata,
              identityVerification,
              ...(i === 0 ? { locale: this.mapContactLocaleToBankflip(locale) } : {}),
            }),
          });
        } catch (error) {
          if (error instanceof InvalidRequestError && error.code === "VALIDATION_ERROR") {
            // Bankflip returns 400 with VALIDATION_ERROR when requested locale is not enabled in the account
            // in this case, we want to retry the request without passing locale param (defaults to "es").
            // log as error so we can be aware of this
            this.logger.error(
              `Organization:${orgId} BankflipService validation error: ${error.message}. Will retry request without locale param.`,
            );
            throw error;
          }
          // any other error, we don't want to retry
          throw new StopRetryError(error);
        }
      },
      { maxRetries: 1 },
    );
  }

  async fetchSessionMetadata(orgId: string, sessionId: string) {
    const session = await this.apiRequest<SessionResponse>(orgId, `/session/${sessionId}`);
    return session.metadata;
  }

  async fetchSessionSummary(orgId: string, sessionId: string) {
    return await this.apiRequest<SessionSummaryResponse>(orgId, `/session/${sessionId}/summary`);
  }

  async fetchIdVerificationSummary(orgId: string, idVerificationId: string) {
    return await this.apiRequest<IdentityVerificationSummaryResponse>(
      orgId,
      `/identity-verification/${idVerificationId}`,
    );
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
      if (isNonNullish(customLogoPath)) {
        customization["companyLogo"] = await this.images.getImageUrl(customLogoPath, {
          resize: { height: 150, width: 150, fit: "fill" },
        });
      }
    }

    return customization;
  }
}
