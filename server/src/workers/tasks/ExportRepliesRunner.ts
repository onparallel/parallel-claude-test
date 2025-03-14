import { createZipFile } from "../../util/createZipFile";
import { sanitizeFilenameWithSuffix } from "../../util/sanitizeFilenameWithSuffix";
import { TaskRunner } from "../helpers/TaskRunner";

export class ExportRepliesRunner extends TaskRunner<"EXPORT_REPLIES"> {
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

    const userData = await this.ctx.users.loadUserDataByUserId(this.task.user_id);

    const zipFile = createZipFile(
      await this.ctx.petitionFiles.getPetitionFiles(petitionId, this.task.user_id, {
        pattern: pattern ?? undefined,
        locale: userData!.preferred_locale,
        include: [
          "PETITION_EXCEL_EXPORT",
          "PETITION_FILE_FIELD_REPLIES",
          "PETITION_LATEST_SIGNATURE",
        ],
      }),
      {
        onProgress: (processed, totalCount) => {
          this.onProgress((processed / totalCount) * 100 * 0.95);
        },
      },
    );

    const tmpFile = await this.uploadTemporaryFile({
      stream: zipFile,
      filename: sanitizeFilenameWithSuffix(name, ".zip"),
      contentType: "application/zip",
    });

    return { temporary_file_id: tmpFile.id };
  }
}
