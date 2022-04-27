import sanitizeFilename from "sanitize-filename";
import { getPetitionFiles } from "../helpers/getPetitionFiles";
import { TaskRunner } from "../helpers/TaskRunner";

export class ExportExcelRunner extends TaskRunner<"EXPORT_EXCEL"> {
  private previousProgress = 0;
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
    const petition = (await this.ctx.petitions.loadPetition(petitionId))!;

    const exportExcel = await getPetitionFiles(
      petitionId,
      {
        locale: petition.locale,
        xlsxOnly: true,
        onProgress: async (progress) => {
          const currentProgress = progress * 100;
          // Avoid updating progress too many times.
          if (currentProgress > this.previousProgress + 10) {
            await this.onProgress(currentProgress);
            this.previousProgress = currentProgress;
          }
        },
      },
      this.ctx
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
