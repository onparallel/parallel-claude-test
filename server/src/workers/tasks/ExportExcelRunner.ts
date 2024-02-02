import sanitizeFilename from "sanitize-filename";
import { getPetitionFiles } from "../helpers/getPetitionFiles";
import { TaskRunner } from "../helpers/TaskRunner";

export class ExportExcelRunner extends TaskRunner<"EXPORT_EXCEL"> {
  async run() {
    const { petition_id: petitionId } = this.task.input;

    if (!this.task.user_id) {
      throw new Error(`Task ${this.task.id} is missing user_id`);
    }
    const hasAccess = await this.ctx.petitions.userHasAccessToPetitions(this.task.user_id, [
      petitionId,
    ]);
    if (!hasAccess) {
      throw new Error(`User ${this.task.user_id} has no access to petition ${petitionId}`);
    }

    const userData = await this.ctx.users.loadUserDataByUserId(this.task.user_id);

    const exportExcel = await getPetitionFiles(
      petitionId,
      this.task.user_id,
      {
        locale: userData!.preferred_locale,
        xlsxOnly: true,
        onProgress: async (progress) => {
          await this.onProgress(progress * 100 * 0.95);
        },
      },
      this.ctx,
    ).next();

    if (!exportExcel.value) {
      throw new Error(`No replies to export to xlsx file on Petition:${petitionId}`);
    }

    const tmpFile = await this.uploadTemporaryFile({
      stream: exportExcel.value.stream,
      filename: sanitizeFilename(exportExcel.value!.filename),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return { temporary_file_id: tmpFile.id };
  }
}
