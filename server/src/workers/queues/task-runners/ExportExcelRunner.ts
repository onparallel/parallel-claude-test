import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../../../config";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { ILogger, LOGGER } from "../../../services/Logger";
import {
  PETITION_FILES_SERVICE,
  PetitionFilesService,
} from "../../../services/PetitionFilesService";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { TaskRunner } from "../../helpers/TaskRunner";

@injectable()
export class ExportExcelRunner extends TaskRunner<"EXPORT_EXCEL"> {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(PETITION_FILES_SERVICE) private petitionFiles: PetitionFilesService,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }

  async run(task: Task<"EXPORT_EXCEL">) {
    const { petition_id: petitionId, export_empty_file: exportEmptyFile } = task.input;

    if (!task.user_id) {
      throw new Error(`Task ${task.id} is missing user_id`);
    }
    const hasAccess = await this.petitions.userHasAccessToPetitions(task.user_id, [petitionId]);
    if (!hasAccess) {
      throw new Error(`User ${task.user_id} has no access to petition ${petitionId}`);
    }

    const userData = await this.users.loadUserDataByUserId(task.user_id);

    const [exportExcel] = await this.petitionFiles.getPetitionFiles(petitionId, task.user_id, {
      locale: userData!.preferred_locale,
      include: ["PETITION_EXCEL_EXPORT"],
      includeEmptyExcel: exportEmptyFile,
    });

    if (!exportExcel) {
      // excel file was not exported as petitions does not have text replies nor comments
      throw new Error(`No replies to export to xlsx file on Petition:${petitionId}`);
    }

    await this.onProgress(task, 50);

    const tmpFile = await this.uploadTemporaryFile({
      stream: await exportExcel.getStream(),
      filename: exportExcel.filename,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return { temporary_file_id: tmpFile.id };
  }
}
