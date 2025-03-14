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

    const [exportExcel] = await this.ctx.petitionFiles.getPetitionFiles(
      petitionId,
      this.task.user_id,
      {
        locale: userData!.preferred_locale,
        include: ["PETITION_EXCEL_EXPORT"],
      },
    );

    if (!exportExcel) {
      throw new Error(`No replies to export to xlsx file on Petition:${petitionId}`);
    }

    await this.onProgress(50);

    const tmpFile = await this.uploadTemporaryFile({
      stream: await exportExcel.getStream(),
      filename: exportExcel.filename,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return { temporary_file_id: tmpFile.id };
  }
}
