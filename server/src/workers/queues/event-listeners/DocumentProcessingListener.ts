import { inject, injectable } from "inversify";
import { isNonNullish, isNullish } from "remeda";
import { CONFIG, Config } from "../../../config";
import { ReplyCreatedEvent, ReplyUpdatedEvent } from "../../../db/events/PetitionEvent";
import { FeatureFlagRepository } from "../../../db/repositories/FeatureFlagRepository";
import { FileRepository } from "../../../db/repositories/FileRepository";
import {
  EnhancedOrgIntegration,
  IntegrationRepository,
} from "../../../db/repositories/IntegrationRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { TaskRepository } from "../../../db/repositories/TaskRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import {
  InvalidCredentialsError,
  InvalidRequestError,
} from "../../../integrations/helpers/GenericIntegration";
import {
  DOCUMENT_PROCESSING_SERVICE,
  IDocumentProcessingService,
} from "../../../services/DocumentProcessingService";
import { PetitionFieldOptions } from "../../../services/PetitionFieldService";
import { toBytes } from "../../../util/fileSize";
import { EventListener } from "../EventProcessorQueue";

export const DOCUMENT_PROCESSING_LISTENER = Symbol.for("DOCUMENT_PROCESSING_LISTENER");

@injectable()
export class DocumentProcessingListener
  implements EventListener<"REPLY_CREATED" | "REPLY_UPDATED">
{
  constructor(
    @inject(CONFIG) private readonly config: Config,
    @inject(PetitionRepository) private readonly petitions: PetitionRepository,
    @inject(IntegrationRepository) private readonly integrations: IntegrationRepository,
    @inject(FeatureFlagRepository) private readonly featureFlags: FeatureFlagRepository,
    @inject(UserRepository) private readonly users: UserRepository,
    @inject(FileRepository) private readonly files: FileRepository,
    @inject(TaskRepository) private readonly tasks: TaskRepository,
    @inject(DOCUMENT_PROCESSING_SERVICE)
    private readonly documentProcessing: IDocumentProcessingService,
  ) {}

  public readonly types: ("REPLY_CREATED" | "REPLY_UPDATED")[] = ["REPLY_CREATED", "REPLY_UPDATED"];

  public async handle(event: ReplyCreatedEvent | ReplyUpdatedEvent) {
    const reply = await this.petitions.loadFieldReply(event.data.petition_field_reply_id);
    if (
      !reply ||
      reply.type !== "FILE_UPLOAD" ||
      isNullish(reply.content.file_upload_id) ||
      Number.isNaN(reply.content.file_upload_id)
    ) {
      return;
    }

    const petition = await this.petitions.loadPetition(event.petition_id);
    const field = await this.petitions.loadField(reply.petition_field_id);

    if (!petition || !field) {
      return;
    }

    const options = field.options as PetitionFieldOptions["FILE_UPLOAD"];
    if (isNonNullish(options.documentProcessing)) {
      const integrations = await this.integrations.loadIntegrationsByOrgId(
        petition.org_id,
        "DOCUMENT_PROCESSING",
      );

      const integrationId =
        integrations.find((i) => i.is_default)?.id ?? integrations[0]?.id ?? null;

      const updatedBy = event.data.user_id
        ? `User:${event.data.user_id}`
        : `PetitionAccess:${event.data.petition_access_id}`;

      try {
        if (isNullish(integrationId)) {
          throw new InvalidRequestError("INTEGRATION_NOT_FOUND");
        }

        await this.documentProcessing.startDocumentProcessing(
          integrationId,
          reply.content.file_upload_id,
          options.documentProcessing.processDocumentAs,
          { petition_field_reply_id: reply.id },
          updatedBy,
        );
      } catch (error) {
        if (error instanceof InvalidRequestError || error instanceof InvalidCredentialsError) {
          await this.petitions.updatePetitionFieldReply(
            reply.id,
            {
              metadata: {
                type: options.documentProcessing.processDocumentAs,
                error: error.code,
              },
            },
            updatedBy,
            true,
          );
        }
      }
    }

    if (options.processDocument) {
      const hasFeatureFlag = await this.featureFlags.orgHasFeatureFlag(
        petition.org_id,
        "DOCUMENT_PROCESSING",
      );
      if (!hasFeatureFlag) {
        return;
      }

      const completionIntegrations = await this.integrations.loadIntegrationsByOrgId(
        petition.org_id,
        "AI_COMPLETION",
      );

      const awsBedrockIntegration = completionIntegrations.find(
        (i) => i.provider === "AWS_BEDROCK",
      );
      const anthropicIntegration = completionIntegrations.find((i) => i.provider === "ANTHROPIC");
      const completionIntegration = (awsBedrockIntegration ?? anthropicIntegration) as
        | EnhancedOrgIntegration<"AI_COMPLETION", "AWS_BEDROCK" | "ANTHROPIC">
        | undefined;

      if (!completionIntegration) {
        return;
      }

      const user = event.data.user_id ? await this.users.loadUser(event.data.user_id) : null;
      const access = event.data.petition_access_id
        ? await this.petitions.loadAccess(event.data.petition_access_id)
        : null;

      if (!user && !access) {
        return;
      }

      const file = await this.files.loadFileUpload(reply.content.file_upload_id);

      if (
        !file ||
        !["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"].includes(
          file.content_type,
        ) ||
        parseInt(file.size) > toBytes(10, "MB")
      ) {
        return;
      }

      await this.tasks.createTask(
        {
          name: "DOCUMENT_PROCESSING",
          input: {
            petition_field_reply_id: reply.id,
            file_upload_id: reply.content.file_upload_id,
            integration_id: completionIntegration.id,
            model: completionIntegration.settings.MODEL,
          },
          user_id: user?.id ?? null,
          petition_access_id: access?.id ?? null,
        },
        this.config.instanceName,
      );
    }
  }
}
