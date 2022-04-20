import sanitizeFilename from "sanitize-filename";
import { random } from "../../util/token";
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

    const path = random(16);
    const res = await this.ctx.aws.temporaryFiles.uploadFile(
      path,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      exportExcel.value!.stream
    );

    const tmpFile = await this.ctx.files.createTemporaryFile(
      {
        path,
        content_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename: sanitizeFilename(exportExcel.value!.filename),
        size: res["ContentLength"]!.toString(),
      },
      `TaskWorker:${this.task.id}`
    );

    return { temporary_file_id: tmpFile.id };
  }
}
