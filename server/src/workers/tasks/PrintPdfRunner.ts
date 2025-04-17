import { createReadStream } from "fs";
import { isNonNullish, isNullish } from "remeda";
import { sanitizeFilenameWithSuffix } from "../../util/sanitizeFilenameWithSuffix";
import { withTempDir } from "../../util/withTempDir";
import { TaskRunner } from "../helpers/TaskRunner";

export class PrintPdfRunner extends TaskRunner<"PRINT_PDF"> {
  async run() {
    const {
      petition_id: petitionId,
      skip_attachments: skipAttachments,
      include_netdocuments_links: includeNetDocumentsLinks,
    } = this.task.input;

    const hasAccess = isNonNullish(this.task.user_id)
      ? await this.ctx.petitions.userHasAccessToPetitions(this.task.user_id, [petitionId])
      : isNonNullish(this.task.petition_access_id)
        ? this.ctx.petitions.recipientHasAccessToPetition(this.task.petition_access_id, petitionId)
        : false;
    if (!hasAccess) {
      throw new Error(
        `${
          isNonNullish(this.task.user_id)
            ? `User:${this.task.user_id}`
            : `PetitionAccess:${this.task.petition_access_id}`
        } has no access to petition ${petitionId}`,
      );
    }
    const [petition, owner] = await Promise.all([
      this.ctx.petitions.loadPetition(petitionId),
      this.ctx.petitions.loadPetitionOwner(petitionId),
    ]);
    if (isNullish(petition)) {
      throw new Error(`Petition:${petitionId} not found`);
    }
    if (isNullish(owner)) {
      throw new Error(`Owner of petition Petition:${petitionId} not found`);
    }

    const documentTitle = petition.signature_config?.isEnabled
      ? (petition.signature_config?.title ?? null)
      : null;

    await this.onProgress(25);

    await using tempDir = await withTempDir();
    const tmpFilePath = await this.ctx.petitionBinder.createBinder(owner.id, {
      petitionId,
      documentTitle,
      includeAnnexedDocuments: !skipAttachments,
      includeNetDocumentsLinks,
      outputFilePath: tempDir.path,
    });

    await this.onProgress(75);

    const tmpFile = await this.uploadTemporaryFile({
      stream: createReadStream(tmpFilePath),
      filename: sanitizeFilenameWithSuffix(documentTitle ?? "parallel", ".pdf"),
      contentType: "application/pdf",
    });

    return { temporary_file_id: tmpFile.id };
  }
}
