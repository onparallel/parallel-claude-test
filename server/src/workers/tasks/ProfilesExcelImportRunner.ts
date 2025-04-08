import { assert } from "ts-essentials";
import { importFromExcel } from "../../graphql/helpers/importDataFromExcel";
import { CellError, InvalidDataError, UnknownIdError } from "../../services/ProfileExcelService";
import { withError } from "../../util/promises/withError";
import { TaskRunner } from "../helpers/TaskRunner";

export class ProfilesExcelImportRunner extends TaskRunner<"PROFILES_EXCEL_IMPORT"> {
  async run() {
    const { temporary_file_id: temporaryFileId, profile_type_id: profileTypeId } = this.task.input;

    if (!this.task.user_id) {
      throw new Error(`Task ${this.task.id} is missing user_id`);
    }

    const temporaryFile = await this.ctx.files.loadTemporaryFile(temporaryFileId);
    const profileType = await this.ctx.profiles.loadProfileType(profileTypeId);
    const user = await this.ctx.users.loadUser(this.task.user_id);

    assert(profileType, `Profile type ${profileTypeId} not found`);
    assert(user, `User ${this.task.user_id} not found`);
    assert(user.org_id === profileType.org_id);
    assert(temporaryFile, `Temporary file ${temporaryFileId} not found`);

    const file = await this.ctx.storage.temporaryFiles.downloadFile(temporaryFile.path);

    const [importError, importData] = await withError(importFromExcel(file));
    if (importError) {
      return {
        success: false,
        error: {
          code: "INVALID_FILE_ERROR",
        },
      };
    }

    try {
      const data = await this.ctx.profileExcelImport.parseExcelData(
        profileTypeId,
        importData,
        user.id,
      );

      await this.ctx.profileExcelImport.importDataIntoProfiles(
        profileTypeId,
        data,
        user,
        async (count, total) => {
          await this.onProgress((count / total) * 100);
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
