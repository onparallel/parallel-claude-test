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
import { FETCH_SERVICE, IFetchService } from "./FetchService";
import { IImageService, IMAGE_SERVICE } from "./ImageService";
import {
  ORGANIZATION_CREDITS_SERVICE,
  OrganizationCreditsService,
} from "./OrganizationCreditsService";
import { STORAGE_SERVICE, StorageService } from "./StorageService";
import { Maybe } from "../util/types";

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
interface SessionSummaryResponse {
  modelRequestOutcomes: ModelRequestOutcome[];
}

interface SessionResponse {
  id: string;
  metadata: SessionMetadata;
}

export const BANKFLIP_SERVICE = Symbol.for("BANKFLIP_SERVICE");

export interface IBankflipService {
  /** called to start a session with Bankflip to request a person's documents */
  createSession(metadata: SessionMetadata): Promise<CreateSessionResponse>;
  /** webhook callback for when document extraction has finished and the session is completed */
  webhookSecret(orgId: string): string;
  fetchSessionMetadata(orgId: string, sessionId: string): Promise<SessionMetadata>;
  fetchSessionSummary(orgId: string, sessionId: string): Promise<SessionSummaryResponse>;
  fetchPdfDocumentContents(orgId: string, documentId: string): Promise<Buffer>;
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
    @inject(STORAGE_SERVICE) private storage: StorageService,
    @inject(ORGANIZATION_CREDITS_SERVICE) private orgCredits: OrganizationCreditsService,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(CONFIG) private config: Config,
  ) {}

  webhookSecret(orgId: string) {
    switch (orgId) {
      case this.config.bankflip.saldadosOrgId:
        return this.config.bankflip.saldadosWebhookSecret;
      case this.config.bankflip.debifyOrgId:
        return this.config.bankflip.debifyWebhookSecret;
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
    if (!field?.options.requests) {
      throw new Error(`Expected to have models configured in PetitionField:${fieldId}`);
    }
    const petition = await this.petitions.loadPetition(field.petition_id);
    const organization = await this.organizations.loadOrg(petition!.org_id);
    const hasRemoveParallelBranding = await this.featureFlags.orgHasFeatureFlag(
      organization!.id,
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

    return await this.apiRequest<CreateSessionResponse>(metadata.orgId, "/session", {
      method: "POST",
      body: JSON.stringify({
        requests: field.options.requests,
        webhookUrl: `${baseWebhookUrl}/api/webhooks/bankflip/v2/${metadata.orgId}`,
        customization,
        metadata,
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

  async fetchPdfDocumentContents(orgId: string, documentId: string) {
    return await this.apiRequest<Buffer>(orgId, `/document/${documentId}/content`, {}, "buffer");
  }

  async fetchJsonDocumentContents(orgId: string, documentId: string) {
    return await this.apiRequest<any>(orgId, `/document/${documentId}/content`);
  }
}
