import stringify from "fast-safe-stringify";
import { inject, injectable } from "inversify";
import { pick } from "remeda";
import { Config, CONFIG } from "../../../config";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { ProfileRepository } from "../../../db/repositories/ProfileRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import { ILogger, LOGGER } from "../../../services/Logger";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { TaskRunner } from "../../helpers/TaskRunner";

@injectable()
export class ProfileNamePatternUpdatedRunner extends TaskRunner<"PROFILE_NAME_PATTERN_UPDATED"> {
  constructor(
    @inject(ProfileRepository) private profiles: ProfileRepository,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }
  async run(task: Task<"PROFILE_NAME_PATTERN_UPDATED">) {
    try {
      const { profile_type_id: profileTypeId } = task.input;

      const profileType = await this.profiles.loadProfileType(profileTypeId);

      if (!profileType) {
        throw new Error(`ProfileType:${profileTypeId} not found`);
      }

      if (!task.user_id) {
        throw new Error(`Task ${task.id} is missing user_id`);
      }

      await this.profiles.updateProfileNamesByProfileTypePattern(
        profileType.id,
        profileType.profile_name_pattern,
        `User:${task.user_id}`,
      );

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? pick(error, ["message", "stack"]) : stringify(error),
      };
    }
  }
}
