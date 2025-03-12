import sanitizeFilename from "sanitize-filename";
import { createZipFile, ZipFileInput } from "../../util/createZipFile";
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

    // TODO: any error inside getPetitionFiles is not being captured. we should fix this...
    const zipFile = createZipFile(
      this.ctx.petitionFiles.getPetitionFiles<ZipFileInput>(
        petitionId,
        this.task.user_id,
        async (storage, path, filename) => ({
          filename: sanitizeFilename(filename),
          stream: await storage.downloadFile(path),
        }),
        {
          pattern: pattern ?? undefined,
          locale: userData!.preferred_locale,
          include: ["excel-file", "petition-field-files", "latest-signature"],
          onProgress: async (progress) => {
            // this.ctx.logger.info(
            //   `Exporting files for Petition:${petitionId}: ${Math.round(progress * 100)}%`,
            // );
            await this.onProgress(progress * 100 * 0.95);
          },
        },
      ),
    );

    const tmpFile = await this.uploadTemporaryFile({
      stream: zipFile,
      filename: sanitizeFilenameWithSuffix(name, ".zip"),
      contentType: "application/zip",
    });

    return { temporary_file_id: tmpFile.id };
  }
}
