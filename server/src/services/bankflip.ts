import { inject, injectable } from "inversify";
import { RequestInit } from "node-fetch";
import pMap from "p-map";
import { Config, CONFIG } from "../config";
import { ContactRepository } from "../db/repositories/ContactRepository";
import { FileRepository } from "../db/repositories/FileRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { getBaseWebhookUrl } from "../util/getBaseWebhookUrl";
import { fromGlobalId } from "../util/globalId";
import { sign } from "../util/jwt";
import { random } from "../util/token";
import { Maybe } from "../util/types";
import { FETCH_SERVICE, IFetchService } from "./fetch";
import { OrganizationCreditsService, ORGANIZATION_CREDITS_SERVICE } from "./organization-credits";
import { IRedis, REDIS } from "./redis";
import { StorageService, STORAGE_SERVICE } from "./storage";

export type SessionPayload =
  | { fieldId: string; userId: string }
  | { fieldId: string; accessId: string };

/** When the Session is completed. (every requested model has been extracted) */
export type SessionCompletedWebhookEvent = {
  name: "SESSION_COMPLETED";
  payload: {
    sessionId: string;
  };
};

/** Each time that modelRequest has extracted one or more documents. */
export type ModelExtractedWebhookEvent = {
  name: "MODEL_EXTRACTED";
  payload: {
    sessionId: string;
    documentIds: string[];
    model: {
      type: string;
      year?: number;
      month?: "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "11" | "12";
      quarter?: "Q1" | "Q2" | "Q3" | "Q4";
      licensePlate?: string;
    };
  };
};

type ModelRequestDocument = {
  contentType: string;
  createdAt: string;
  extension: string;
  id: string;
  model: {
    type: string;
  };
  name: string;
  sessionId: string;
};

type CreateSessionResponse = {
  id: string;
  widgetLink: string;
};

type SessionSummaryResponse = {
  modelRequestOutcomes: {
    completed: boolean;
    documents: Maybe<ModelRequestDocument[]>;
  }[];
};

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
    @inject(STORAGE_SERVICE) private storage: StorageService,
    @inject(ORGANIZATION_CREDITS_SERVICE) private orgCredits: OrganizationCreditsService,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(CONFIG) private config: Config,
    @inject(REDIS) private redis: IRedis
  ) {}

  private async apiRequest<T>(
    url: string,
    init?: RequestInit,
    type: "json" | "buffer" = "json"
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
    // there is a bankflip request started, but documents are not yet being processed.
    // in this stage client needs to stop polling if popup is closed
    await this.redis.set(`bankflip-${payload.fieldId}-status`, "idle", 60);

    const token = await sign(payload, this.config.security.jwtSecret, { expiresIn: "1d" });

    const baseWebhookUrl = await getBaseWebhookUrl(this.config.misc.webhooksUrl);
    const fieldId = fromGlobalId(payload.fieldId, "PetitionField").id;
    const field = await this.petitions.loadField(fieldId);
    if (!field?.options.models) {
      throw new Error(`Expected to have models configured in PetitionField:${fieldId}`);
    }

    return await this.apiRequest<CreateSessionResponse>("/session", {
      method: "POST",
      body: JSON.stringify({
        requests: field.options.models,
        webhookUrl: `${baseWebhookUrl}/api/webhooks/bankflip?token=${token}`,
        customization: {
          companyName: "Parallel",
        },
      }),
    });
  }

  async sessionCompleted(
    payload: SessionPayload,
    event: SessionCompletedWebhookEvent
  ): Promise<void> {
    // webhook received, set uploading status on redis so client keeps polling for result even if popup is closed
    await this.redis.set(`bankflip-${payload.fieldId}-status`, "uploading", 60);

    await this.consumePetitionCredits(payload);

    const summary = await this.apiRequest<SessionSummaryResponse>(
      `/session/${event.payload.sessionId}/summary`
    );

    await pMap(
      summary.modelRequestOutcomes.filter((outcome) => outcome.completed),
      async (model) => {
        await this.extractAndUploadModelDocuments(payload, model.documents);
      },
      { concurrency: 2 }
    );

    // set a 1 min key in redis so front-end is able to recognize when all models have been processed to stop polling (success or error)
    await this.redis.set(`bankflip-${payload.fieldId}-status`, "completed", 60);
  }

  private async consumePetitionCredits(payload: SessionPayload) {
    if ("userId" in payload) {
      const fieldId = fromGlobalId(payload.fieldId, "PetitionField").id;
      const userId = fromGlobalId(payload.userId, "User").id;
      const field = (await this.petitions.loadField(fieldId))!;
      await this.orgCredits.ensurePetitionHasConsumedCredit(field.petition_id, `User:${userId}`);
    }
  }

  /** given a list of documents of the same model, download the contents and upload them as a field reply */
  private async extractAndUploadModelDocuments(
    payload: SessionPayload,
    documents: Maybe<ModelRequestDocument[]>
  ) {
    const fieldId = fromGlobalId(payload.fieldId, "PetitionField").id;
    const data =
      "userId" in payload
        ? { user_id: fromGlobalId(payload.userId, "User").id }
        : { petition_access_id: fromGlobalId(payload.accessId, "PetitionAccess").id };

    const creator =
      "userId" in payload
        ? await this.users.loadUser(fromGlobalId(payload.userId, "User").id)
        : await this.contacts.loadContactByAccessId(
            fromGlobalId(payload.accessId, "PetitionAccess").id
          );

    const jsonDocument = (documents ?? []).find((doc) => doc.extension === "json");
    const pdfDocument = (documents ?? []).find((doc) => doc.extension === "pdf");

    try {
      if (!pdfDocument) {
        throw new Error(
          `Couldn't find a PDF document to be uploaded as reply on PetitionField:${fieldId}`
        );
      }

      const jsonContents = jsonDocument
        ? await this.apiRequest<any>(`/document/${jsonDocument.id}/content`)
        : null;

      const pdfBuffer = await this.apiRequest<Buffer>(
        `/document/${pdfDocument.id}/content`,
        {},
        "buffer"
      );

      const path = random(16);
      const res = await this.storage.fileUploads.uploadFile(path, "application/pdf", pdfBuffer);
      const [file] = await this.files.createFileUpload(
        {
          path,
          content_type: "application/pdf",
          filename: pdfDocument.name,
          size: res["ContentLength"]!.toString(),
          upload_complete: true,
        },
        "userId" in payload ? `User:${creator!.id}` : `Contact:${creator!.id}`
      );

      const data =
        "userId" in payload
          ? { user_id: fromGlobalId(payload.userId, "User").id }
          : { petition_access_id: fromGlobalId(payload.accessId, "PetitionAccess").id };

      await this.petitions.createPetitionFieldReply(
        {
          petition_field_id: fieldId,
          type: "ES_TAX_DOCUMENTS",
          content: {
            file_upload_id: file.id,
            json_contents: jsonDocument
              ? { model: jsonDocument.model, document: jsonContents }
              : null,
          },
          ...data,
        },
        creator!
      );
    } catch {}
  }
}
