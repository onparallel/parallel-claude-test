import { assert } from "ts-essentials";
import { importFromExcel } from "../../graphql/helpers/importDataFromExcel";
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

    const importData = await importFromExcel(file);

    const data = await this.ctx.profileImport.parseExcelData(
      profileTypeId,
      importData,
      user.id,
      false, // no need to validate field contents again, we already did that in the mutation that triggered this task
    );

    await this.ctx.profileImport.importDataIntoProfiles(
      profileTypeId,
      data,
      user,
      async (count, total) => {
        await this.onProgress((count / total) * 100);
      },
    );

    return { success: true, count: data.length };
  }
}
