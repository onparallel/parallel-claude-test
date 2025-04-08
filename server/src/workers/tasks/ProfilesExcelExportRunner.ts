import { random } from "../../util/token";
import { TaskRunner } from "../helpers/TaskRunner";

export class ProfilesExcelExportRunner extends TaskRunner<"PROFILES_EXCEL_EXPORT"> {
  async run() {
    const {
      profile_type_id: profileTypeId,
      search,
      filter,
      sort_by: sortBy,
      locale,
    } = this.task.input;

    if (!this.task.user_id) {
      throw new Error(`Task ${this.task.id} is missing user_id`);
    }

    const { stream, filename, contentType } = await this.ctx.profileExcelExport.export(
      profileTypeId,
      search,
      filter,
      sortBy,
      locale,
      this.task.user_id,
      async (count, total) => {
        await this.onProgress((count / total) * 100 * 0.95);
      },
    );

    const path = random(16);
    const response = await this.ctx.storage.temporaryFiles.uploadFile(path, contentType, stream);

    const tmpFile = await this.ctx.files.createTemporaryFile(
      {
        path,
        filename,
        content_type: contentType,
        size: response["ContentLength"]?.toString() ?? "0",
      },
      `User:${this.task.user_id}`,
    );

    return { temporary_file_id: tmpFile.id };
  }
}
