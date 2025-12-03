import { inject, injectable } from "inversify";
import { assert } from "ts-essentials";
import { Config, CONFIG } from "../../../config";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { ProfileRepository } from "../../../db/repositories/ProfileRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { ILogger, LOGGER } from "../../../services/Logger";
import {
  PROFILE_EXCEL_IMPORT_SERVICE,
  ProfileExcelImportService,
} from "../../../services/ProfileExcelImportService";
import { CellError, InvalidDataError, UnknownIdError } from "../../../services/ProfileExcelService";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { importFromExcel } from "../../../util/importFromExcel";
import { withError } from "../../../util/promises/withError";
import { TaskRunner } from "../../helpers/TaskRunner";

@injectable()
export class ProfilesExcelImportRunner extends TaskRunner<"PROFILES_EXCEL_IMPORT"> {
  constructor(
    @inject(UserRepository) private users: UserRepository,
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(PROFILE_EXCEL_IMPORT_SERVICE) private profileExcelImport: ProfileExcelImportService,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }

  async run(task: Task<"PROFILES_EXCEL_IMPORT">) {
    const { temporary_file_id: temporaryFileId, profile_type_id: profileTypeId } = task.input;

    if (!task.user_id) {
      throw new Error(`Task ${task.id} is missing user_id`);
    }

    const temporaryFile = await this.files.loadTemporaryFile(temporaryFileId);
    const profileType = await this.profiles.loadProfileType(profileTypeId);
    const user = await this.users.loadUser(task.user_id);

    assert(profileType, `Profile type ${profileTypeId} not found`);
    assert(user, `User ${task.user_id} not found`);
    assert(user.org_id === profileType.org_id);
    assert(temporaryFile, `Temporary file ${temporaryFileId} not found`);

    const file = await this.storage.temporaryFiles.downloadFile(temporaryFile.path);

    const [importError, importData] = await withError(
      importFromExcel(file, { maxRows: 2 + 10_000 }), // 2 header rows + 10k profiles
    );
    if (importError) {
      return {
        success: false,
        error: {
          code:
            importError.message === "ROW_LIMIT_REACHED"
              ? "ROW_LIMIT_REACHED"
              : "INVALID_FILE_ERROR",
          limit: 10_000,
        },
      };
    }

    try {
      const data = await this.profileExcelImport.parseExcelData(profileTypeId, importData, user.id);

      await this.profileExcelImport.importDataIntoProfiles(
        profileTypeId,
        data,
        user,
        async (count, total) => {
          await this.onProgress(task, (count / total) * 100);
        },
      );

      return { success: true, count: data.length };
    } catch (error) {
      if (error instanceof InvalidDataError) {
        return {
          success: false,
          error: {
            code: "INVALID_FILE_ERROR",
          },
        };
      } else if (error instanceof CellError) {
        return {
          success: false,
          error: {
            code: "INVALID_CELL_ERROR",
            cell: error.cell,
            message: error.message,
          },
        };
      } else if (error instanceof UnknownIdError) {
        return {
          success: false,
          error: {
            code: "INVALID_CELL_ERROR",
            cell: {
              col: importData[1].indexOf(error.id) + 1,
              row: 2,
              value: error.id,
            },
          },
        };
      }

      throw error;
    }
  }
}
