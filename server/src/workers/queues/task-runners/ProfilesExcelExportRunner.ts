import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../../../config";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import { ILogger, LOGGER } from "../../../services/Logger";
import {
  PROFILE_EXCEL_EXPORT_SERVICE,
  ProfileExcelExportService,
} from "../../../services/ProfileExcelExportService";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { random } from "../../../util/token";
import { TaskRunner } from "../../helpers/TaskRunner";

@injectable()
export class ProfilesExcelExportRunner extends TaskRunner<"PROFILES_EXCEL_EXPORT"> {
  constructor(
    @inject(PROFILE_EXCEL_EXPORT_SERVICE) private profileExcelExport: ProfileExcelExportService,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }

  async run(task: Task<"PROFILES_EXCEL_EXPORT">) {
    const { profile_type_id: profileTypeId, search, filter, sort_by: sortBy, locale } = task.input;

    if (!task.user_id) {
      throw new Error(`Task ${task.id} is missing user_id`);
    }

    const { stream, filename, contentType } = await this.profileExcelExport.export(
      profileTypeId,
      search,
      filter,
      sortBy,
      locale,
      task.user_id,
      async (count, total) => {
        await this.onProgress(task, (count / total) * 100 * 0.95);
      },
    );

    const path = random(16);
    const response = await this.storage.temporaryFiles.uploadFile(path, contentType, stream);

    const tmpFile = await this.files.createTemporaryFile(
      {
        path,
        filename,
        content_type: contentType,
        size: response["ContentLength"]?.toString() ?? "0",
      },
      `User:${task.user_id}`,
    );

    return { temporary_file_id: tmpFile.id };
  }
}
