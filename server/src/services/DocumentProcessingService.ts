import { inject, injectable } from "inversify";
import { assert } from "ts-essentials";
import { Config, CONFIG } from "../config";
import { DocumentProcessingType } from "../db/__types";
import { FileRepository } from "../db/repositories/FileRepository";
import { IntegrationRepository } from "../db/repositories/IntegrationRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import {
  BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION,
  BankflipDocumentProcessingIntegration,
} from "../integrations/document-processing/bankflip/BankflipDocumentProcessingIntegration";
import { DocumentData } from "../integrations/document-processing/DocumentProcessingIntegration";
import { never } from "../util/never";

export const DOCUMENT_PROCESSING_SERVICE = Symbol.for("DOCUMENT_PROCESSING_SERVICE");

export interface IDocumentProcessingService {
  startDocumentProcessing(
    integrationId: number,
    fileUploadId: number,
    type: DocumentProcessingType,
    metadata: Record<string, any>,
    startedBy: string,
  ): Promise<void>;

  onCompleted<TDocType extends DocumentProcessingType>(
    externalId: string,
    raw: any,
    parser: (rawResult: any) => DocumentData<TDocType>[],
  ): Promise<void>;
}

@injectable()
export class DocumentProcessingService implements IDocumentProcessingService {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(FileRepository) private files: FileRepository,
    @inject(BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION)
    private bankflipDocumentProcessingIntegration: BankflipDocumentProcessingIntegration,
    @inject(CONFIG) private config: Config,
  ) {}

  private async getIntegration(integrationId: number) {
    const orgIntegration = await this.integrations.loadIntegration(integrationId);

    assert(
      orgIntegration?.type === "DOCUMENT_PROCESSING",
      "DOCUMENT_PROCESSING integration not found",
    );

    switch (orgIntegration.provider) {
      case "BANKFLIP":
        return { provider: "BANKFLIP", integration: this.bankflipDocumentProcessingIntegration };
        break;
      default:
        never(`Unknown provider ${orgIntegration.provider}`);
    }
  }

  async startDocumentProcessing(
    integrationId: number,
    fileUploadId: number,
    type: DocumentProcessingType,
    metadata: Record<string, any>,
    startedBy: string,
  ) {
    const log = await this.integrations.createDocumentProcessingLog(
      {
        integration_id: integrationId,
        file_upload_id: fileUploadId,
        document_type: type,
        metadata,
      },
      startedBy,
    );

    try {
      const { provider, integration } = await this.getIntegration(integrationId);

      const file = await this.files.loadFileUpload(fileUploadId);
      assert(file, "File not found");

      const externalId = await integration.createDocumentExtractionRequest(
        integrationId,
        file,
        type,
      );

      await this.integrations.updateDocumentProcessingLog(
        log.id,
        { external_id: `${provider}/${externalId}` },
        startedBy,
      );
    } catch (error) {
      await this.integrations.updateDocumentProcessingLog(log.id, { error }, startedBy);

      throw error;
    }
  }

  async onCompleted<TDocType extends DocumentProcessingType>(
    externalId: string,
    rawResult: any,
    parser: (rawResult: any) => DocumentData<TDocType>[],
  ): Promise<void> {
    const log = await this.integrations.updateDocumentProcessingLogByExternalId(
      externalId,
      { raw_result: rawResult },
      this.config.instanceName,
    );
    assert(log, "Document processing log not found");

    if ("petition_field_reply_id" in log.metadata) {
      const reply = await this.petitions.loadFieldReply(log.metadata.petition_field_reply_id);
      if (reply?.content.file_upload_id === log.file_upload_id) {
        try {
          const inferredData = parser(rawResult);
          await this.petitions.updatePetitionFieldReply(
            log.metadata.petition_field_reply_id,
            { metadata: { type: log.document_type, inferred_data: inferredData } },
            this.config.instanceName,
            true,
          );
        } catch (error) {
          await this.petitions.updatePetitionFieldReply(
            log.metadata.petition_field_reply_id,
            {
              metadata: {
                type: log.document_type,
                error: error instanceof Error ? error.message : "UNKNOWN",
              },
            },
            this.config.instanceName,
            true,
          );
        }
      }
    }
  }
}
