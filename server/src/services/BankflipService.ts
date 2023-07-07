import { inject, injectable } from "inversify";
import { RequestInit } from "node-fetch";
import pMap from "p-map";
import { groupBy, isDefined, zip } from "remeda";
import { CONFIG, Config } from "../config";
import { FeatureFlagRepository } from "../db/repositories/FeatureFlagRepository";
import { FileRepository } from "../db/repositories/FileRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { getBaseWebhookUrl } from "../util/getBaseWebhookUrl";
import { fromGlobalId } from "../util/globalId";
import { pFlatMap } from "../util/promises/pFlatMap";
import { random } from "../util/token";
import { Maybe } from "../util/types";
import { FETCH_SERVICE, IFetchService } from "./FetchService";
import { IImageService, IMAGE_SERVICE } from "./ImageService";
import {
  ORGANIZATION_CREDITS_SERVICE,
  OrganizationCreditsService,
} from "./OrganizationCreditsService";
import { STORAGE_SERVICE, StorageService } from "./StorageService";

type SessionMetadata = {
  petitionId: string;
  fieldId: string;
  orgId: string;
} & ({ userId: string } | { accessId: string });

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

interface SessionResponse {
  id: string;
  metadata: SessionMetadata;
}

export const BANKFLIP_SERVICE = Symbol.for("BANKFLIP_SERVICE");

export interface IBankflipService {
  /** called to start a session with Bankflip to request a person's documents */
  createSession(metadata: SessionMetadata): Promise<CreateSessionResponse>;
  /** webhook callback for when document extraction has finished and the session is completed */
  sessionCompleted(orgId: string, event: SessionCompletedWebhookEvent): Promise<void>;
  webhookSecret(orgId: string): string;
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

  public webhookSecret(orgId: string) {
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

  async sessionCompleted(orgId: string, event: SessionCompletedWebhookEvent): Promise<void> {
    const session = await this.apiRequest<SessionResponse>(
      orgId,
      `/session/${event.payload.sessionId}`,
    );
    const { metadata } = session;
    await this.consumePetitionCredits(metadata);

    const summary = await this.apiRequest<SessionSummaryResponse>(
      orgId,
      `/session/${event.payload.sessionId}/summary`,
    );

    const replyContents = await pFlatMap(
      summary.modelRequestOutcomes,
      async (model) => await this.extractAndUploadModelDocuments(metadata, model),
      { concurrency: 2 },
    );

    const fieldId = fromGlobalId(metadata.fieldId, "PetitionField").id;
    const petitionId = fromGlobalId(metadata.petitionId, "Petition").id;
    const data =
      "userId" in metadata
        ? { user_id: fromGlobalId(metadata.userId, "User").id }
        : { petition_access_id: fromGlobalId(metadata.accessId, "PetitionAccess").id };

    const createdBy =
      "user_id" in data ? `User:${data.user_id}` : `PetitionAccess:${data.petition_access_id}`;

    await this.petitions.createPetitionFieldReply(
      petitionId,
      replyContents.map((content) => ({
        petition_field_id: fieldId,
        type: "ES_TAX_DOCUMENTS",
        content: { ...content, bankflip_session_id: event.payload.sessionId },
        ...data,
      })),
      createdBy,
    );
  }

  private async consumePetitionCredits(metadata: SessionMetadata) {
    if ("userId" in metadata) {
      const fieldId = fromGlobalId(metadata.fieldId, "PetitionField").id;
      const userId = fromGlobalId(metadata.userId, "User").id;
      const field = (await this.petitions.loadField(fieldId))!;
      await this.orgCredits.ensurePetitionHasConsumedCredit(field.petition_id, `User:${userId}`);
    }
  }

  /**
   * extracts the contents of the documents on a given model outcome, uploads the files to S3 and returns the data for creating an ES_TAX_DOCUMENTS reply.
   */
  private async extractAndUploadModelDocuments(
    metadata: SessionMetadata,
    modelRequestOutcome: ModelRequestOutcome,
  ): Promise<any[]> {
    if (isDefined(modelRequestOutcome.noDocumentReasons)) {
      return [
        {
          file_upload_id: null,
          request: modelRequestOutcome.modelRequest,
          error: modelRequestOutcome.noDocumentReasons,
        },
      ];
    }

    // a set of documents with the same request model will be all part of the same PetitionFieldReply
    // TODO cambiar la manera de agrupar documentos una vez Bankflip implemente una solución que lo permita de manera fácil (ya hablado con ellos)
    const groupedByRequestModel = groupBy(modelRequestOutcome.documents ?? [], (d) =>
      Object.keys(d.model)
        .sort()
        .map((key) => d.model[key as keyof ModelRequest])
        .join("_"),
    );
    return await pFlatMap(Object.values(groupedByRequestModel), async (docs) => {
      const documents: Record<string, ModelRequestDocument[]> = {};
      ["pdf", "json"].forEach((extension) => {
        documents[extension] = docs.filter((d) => d.extension === extension);
      });

      if (documents.pdf.length === 0) {
        // should not happen
        return [
          {
            file_upload_id: null,
            request: modelRequestOutcome.modelRequest,
            error: [],
          },
        ];
      }

      const pdfBuffers = await pMap(
        documents.pdf,
        async ({ id }) =>
          await this.apiRequest<Buffer>(metadata.orgId, `/document/${id}/content`, {}, "buffer"),
        { concurrency: 1 },
      );

      const results: any[] = [];
      for (const [request, pdfBuffer] of zip(documents.pdf, pdfBuffers)) {
        const path = random(16);
        const res = await this.storage.fileUploads.uploadFile(path, "application/pdf", pdfBuffer);
        const [file] = await this.files.createFileUpload(
          {
            path,
            content_type: "application/pdf",
            filename: `${request.name}.pdf`,
            size: res["ContentLength"]!.toString(),
            upload_complete: true,
          },
          "userId" in metadata
            ? `User:${fromGlobalId(metadata.userId, "User").id}`
            : `PetitionAccess:${fromGlobalId(metadata.accessId, "PetitionAccess").id}`,
        );

        results.push({
          file_upload_id: file.id,
          request: request,
          json_contents:
            // TODO: el modelo CARP_CIUD_CERT_CATASTRO devuelve multiples pdfs y jsons con el mismo "request".
            // actualmente no se puede identificar cuál json corresponde a cada pdf.
            // hablé con Gabriel para implementar algo que permita identificarlos, pero por ahora
            // ignoramos los json de este modelo. De todas formas aún no lo están parseando.
            // Cuando esté implementada la solución en Bankflip, hay que cambiar la manera de agrupar documentos (comentado más arriba)
            request.model.type === "CARP_CIUD_CERT_CATASTRO"
              ? null
              : documents.json.length === 1
              ? await this.apiRequest<any>(
                  metadata.orgId,
                  `/document/${documents.json[0].id}/content`,
                )
              : null,
        });
      }
      return results;
    });
  }
}
