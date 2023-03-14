import { createZipFile } from "../../util/createZipFile";
import { sanitizeFilenameWithSuffix } from "../../util/sanitizeFilenameWithSuffix";
import { getPetitionFiles } from "../helpers/getPetitionFiles";
import { TaskRunner } from "../helpers/TaskRunner";

export class ExportRepliesRunner extends TaskRunner<"EXPORT_REPLIES"> {
  private previousProgress = 0;
  async run() {
    const { petition_id: petitionId, pattern } = this.task.input;

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
    const name = petition.name?.replace(/\./g, "_") ?? "files";

    const zipFile = createZipFile(
      getPetitionFiles(
        petitionId,
        {
          pattern: pattern ?? undefined,
          locale: petition.locale,
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
      )
    );

    const tmpFile = await this.uploadTemporaryFile({
      stream: zipFile,
      filename: sanitizeFilenameWithSuffix(name, ".zip"),
      contentType: "application/zip",
    });

    return { temporary_file_id: tmpFile.id };
  }
}
