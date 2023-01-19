import { inject, injectable } from "inversify";
import { RequestInit } from "node-fetch";
import pMap from "p-map";
import { isDefined } from "remeda";
import { Config, CONFIG } from "../config";
import { ContactRepository } from "../db/repositories/ContactRepository";
import { FeatureFlagRepository } from "../db/repositories/FeatureFlagRepository";
import { FileRepository } from "../db/repositories/FileRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { getBaseWebhookUrl } from "../util/getBaseWebhookUrl";
import { fromGlobalId } from "../util/globalId";
import { sign } from "../util/jwt";
import { random } from "../util/token";
import { Maybe } from "../util/types";
import { FETCH_SERVICE, IFetchService } from "./fetch";
import { OrganizationCreditsService, ORGANIZATION_CREDITS_SERVICE } from "./organization-credits";
import { StorageService, STORAGE_SERVICE } from "./storage";

export type SessionPayload =
  | { fieldId: string; userId: string }
  | { fieldId: string; accessId: string };

/** When the Session is completed. (every requested model has been extracted) */
export interface SessionCompletedWebhookEvent {
  name: "SESSION_COMPLETED";
  payload: {
    sessionId: string;
  };
}

interface ModelRequest {
  type: string;
  year?: number;
  month?: "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "11" | "12";
  quarter?: "Q1" | "Q2" | "Q3" | "Q4";
  licensePlate?: string;
}

/** Each time that modelRequest has extracted one or more documents. */
export interface ModelExtractedWebhookEvent {
  name: "MODEL_EXTRACTED";
  payload: {
    sessionId: string;
    documentIds: string[];
    model: ModelRequest;
  };
}

interface ModelRequestDocument {
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

interface ModelRequestOutcome {
  completed: boolean;
  documents: Maybe<ModelRequestDocument[]>;
  modelRequest: { model: ModelRequest };
  noDocumentReasons: Maybe<NoDocumentReason[]>;
}
interface SessionSummaryResponse {
  modelRequestOutcomes: ModelRequestOutcome[];
}

export const BANKFLIP_SERVICE = Symbol.for("BANKFLIP_SERVICE");

export interface IBankflipService {
  /** called to start a session with Bankflip to request a person's documents */
  createSession(payload: SessionPayload): Promise<CreateSessionResponse>;
  /** webhook callback for when document extraction has finished and the session is completed */
  sessionCompleted(payload: SessionPayload, event: SessionCompletedWebhookEvent): Promise<void>;
}

@injectable()
export class BankflipService implements IBankflipService {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(ContactRepository) private contacts: ContactRepository,
    @inject(FileRepository) private files: FileRepository,
    @inject(FeatureFlagRepository) private featureFlags: FeatureFlagRepository,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(STORAGE_SERVICE) private storage: StorageService,
    @inject(ORGANIZATION_CREDITS_SERVICE) private orgCredits: OrganizationCreditsService,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(CONFIG) private config: Config
  ) {}

  private async apiRequest<T>(
    url: string,
    init?: RequestInit,
    type: "json" | "buffer" | "text" = "json"
  ): Promise<T> {
    const response = await this.fetch.fetch(`${this.config.bankflip.host}${url}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.bankflip.apiKey}`,
        ...init?.headers,
      },
      ...init,
    });

    return await response[type]();
  }

  async createSession(payload: SessionPayload) {
    const token = await sign(payload, this.config.security.jwtSecret, { expiresIn: "1d" });

    const baseWebhookUrl = await getBaseWebhookUrl(this.config.misc.webhooksUrl);
    const fieldId = fromGlobalId(payload.fieldId, "PetitionField").id;
    const field = await this.petitions.loadField(fieldId);
    if (!field?.options.requests) {
      throw new Error(`Expected to have models configured in PetitionField:${fieldId}`);
    }
    const petition = await this.petitions.loadPetition(field.petition_id);
    const organization = await this.organizations.loadOrg(petition!.org_id);
    const hasRemoveParallelBranding = await this.featureFlags.orgHasFeatureFlag(
      organization!.id,
      "REMOVE_PARALLEL_BRANDING"
    );

    return await this.apiRequest<CreateSessionResponse>("/session", {
      method: "POST",
      body: JSON.stringify({
        requests: field.options.requests,
        webhookUrl: `${baseWebhookUrl}/api/webhooks/bankflip/v2?token=${token}`,
        customization: {
          companyName: hasRemoveParallelBranding ? organization!.name : "Parallel",
        },
      }),
    });
  }

  async sessionCompleted(
    payload: SessionPayload,
    event: SessionCompletedWebhookEvent
  ): Promise<void> {
    await this.consumePetitionCredits(payload);

    const summary = await this.apiRequest<SessionSummaryResponse>(
      `/session/${event.payload.sessionId}/summary`
    );

    const replyContents = await pMap(
      summary.modelRequestOutcomes.filter((outcome) => outcome.completed),
      async (model) => await this.extractAndUploadModelDocuments(payload, model),
      { concurrency: 2 }
    );

    const fieldId = fromGlobalId(payload.fieldId, "PetitionField").id;
    const data =
      "userId" in payload
        ? { user_id: fromGlobalId(payload.userId, "User").id }
        : { petition_access_id: fromGlobalId(payload.accessId, "PetitionAccess").id };

    const createdBy =
      "user_id" in data ? `User:${data.user_id}` : `PetitionAccess:${data.petition_access_id}`;

    await this.petitions.createPetitionFieldReply(
      fieldId,
      replyContents.map((content) => ({
        type: "ES_TAX_DOCUMENTS",
        content,
        ...data,
      })),
      createdBy
    );
  }

  private async consumePetitionCredits(payload: SessionPayload) {
    if ("userId" in payload) {
      const fieldId = fromGlobalId(payload.fieldId, "PetitionField").id;
      const userId = fromGlobalId(payload.userId, "User").id;
      const field = (await this.petitions.loadField(fieldId))!;
      await this.orgCredits.ensurePetitionHasConsumedCredit(field.petition_id, `User:${userId}`);
    }
  }

  /**
   * extracts the contents of the documents on a given model outcome, uploads the files to S3 and returns the data for creating an ES_TAX_DOCUMENTS reply.
   */
  private async extractAndUploadModelDocuments(
    payload: SessionPayload,
    modelRequestOutcome: ModelRequestOutcome
  ): Promise<any> {
    if (isDefined(modelRequestOutcome.noDocumentReasons)) {
      return {
        file_upload_id: null,
        request: modelRequestOutcome.modelRequest,
        error: modelRequestOutcome.noDocumentReasons,
      };
    }

    const documents: Record<string, Maybe<ModelRequestDocument>> = {};
    ["pdf", "json", "xml"].forEach((extension) => {
      documents[extension] =
        modelRequestOutcome.documents?.find((d) => d.extension === extension) ?? null;
    });

    if (!documents.pdf) {
      // should not happen
      return {
        file_upload_id: null,
        request: modelRequestOutcome.modelRequest,
        error: [],
      };
    }

    const pdfBuffer = await this.apiRequest<Buffer>(
      `/document/${documents.pdf.id}/content`,
      {},
      "buffer"
    );

    const path = random(16);
    const res = await this.storage.fileUploads.uploadFile(path, "application/pdf", pdfBuffer);
    const [file] = await this.files.createFileUpload(
      {
        path,
        content_type: "application/pdf",
        filename: documents.pdf.name,
        size: res["ContentLength"]!.toString(),
        upload_complete: true,
      },
      "userId" in payload
        ? `User:${fromGlobalId(payload.userId, "User").id}`
        : `PetitionAccess:${fromGlobalId(payload.accessId, "User").id}`
    );

    const replyContents: Record<string, any> = {
      file_upload_id: file.id,
      request: modelRequestOutcome.modelRequest,
    };

    await pMap([documents.json, documents.xml].filter(isDefined), async (document) => {
      replyContents[`${document.extension}_contents`] = await this.apiRequest<any>(
        `/document/${document.id}/content`,
        {},
        document.extension === "json" ? "json" : "text"
      );
    });

    return replyContents;
  }
}
