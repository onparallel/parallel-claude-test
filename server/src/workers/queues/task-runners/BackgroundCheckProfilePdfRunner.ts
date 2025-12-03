import { inject, injectable } from "inversify";
import { isNonNullish } from "remeda";
import { Config, CONFIG } from "../../../config";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { ProfileRepository } from "../../../db/repositories/ProfileRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import { parseReplyToken } from "../../../graphql/integrations/utils";
import {
  BACKGROUND_CHECK_SERVICE,
  IBackgroundCheckService,
} from "../../../services/BackgroundCheckService";
import { ILogger, LOGGER } from "../../../services/Logger";
import { IRedis, REDIS } from "../../../services/Redis";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { TaskRunner } from "../../helpers/TaskRunner";

@injectable()
export class BackgroundCheckProfilePdfRunner extends TaskRunner<"BACKGROUND_CHECK_PROFILE_PDF"> {
  constructor(
    @inject(REDIS) private redis: IRedis,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(BACKGROUND_CHECK_SERVICE) private backgroundCheck: IBackgroundCheckService,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }

  async run(task: Task<"BACKGROUND_CHECK_PROFILE_PDF">) {
    await using _ = await this.redis.withConnection();
    if (!task.user_id) {
      throw new Error(`Task ${task.id} is missing user_id`);
    }

    const { token, entity_id: entityId } = task.input;

    const params = parseReplyToken(token);

    let replyContent: any = null;
    if ("petitionId" in params) {
      const replies = await this.petitions.loadRepliesForField(params.fieldId);
      replyContent = replies.find(
        (r) =>
          r.type === "BACKGROUND_CHECK" &&
          r.content.entity?.id === entityId &&
          r.parent_petition_field_reply_id === (params.parentReplyId ?? null),
      )?.content;
    } else if ("profileId" in params) {
      // PDFs are generated based on a entity match, so in this case there should never be a draft
      const { value } = await this.profiles.loadProfileFieldValueWithDraft(params);
      replyContent = value && value.content.entity?.id === entityId ? value.content : null;
    }

    const props = isNonNullish(replyContent)
      ? {
          entity: replyContent.entity,
          query: replyContent.query,
          search: replyContent.search,
        }
      : {
          entity: await this.backgroundCheck.entityProfileDetails(entityId, task.user_id),
        };

    await this.onProgress(task, 50);

    const data = await this.backgroundCheck.entityProfileDetailsPdf(task.user_id, props);

    const tmpFile = await this.uploadTemporaryFile({
      stream: data.binary_stream,
      filename: `${props.entity.type}-${props.entity.id}.pdf`,
      contentType: data.mime_type,
    });

    return { temporary_file_id: tmpFile.id };
  }
}
