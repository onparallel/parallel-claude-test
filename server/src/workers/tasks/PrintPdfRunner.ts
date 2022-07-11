import { createReadStream } from "fs";
import { unlink } from "fs/promises";
import { isDefined } from "remeda";
import { sanitizeFilenameWithSuffix } from "../../util/sanitizeFilenameWithSuffix";
import { Maybe } from "../../util/types";
import { TaskRunner } from "../helpers/TaskRunner";

export class PrintPdfRunner extends TaskRunner<"PRINT_PDF"> {
  async run() {
    let tmpFilePath: string | null = null;
    try {
      const {
        petition_id: petitionId,
        skip_attachments: skipAttachments,
        include_netdocuments_links: includeNetDocumentsLinks,
      } = this.task.input;

      const hasAccess = isDefined(this.task.user_id)
        ? await this.ctx.petitions.userHasAccessToPetitions(this.task.user_id, [petitionId])
        : isDefined(this.task.petition_access_id)
        ? this.ctx.petitions.recipientHasAccessToPetition(this.task.petition_access_id, petitionId)
        : false;
      if (!hasAccess) {
        throw new Error(
          `${
            isDefined(this.task.user_id)
              ? `User:${this.task.user_id}`
              : `PetitionAccess:${this.task.petition_access_id}`
          } has no access to petition ${petitionId}`
        );
      }
      const [petition, owner] = await Promise.all([
        this.ctx.petitions.loadPetition(petitionId),
        this.ctx.petitions.loadPetitionOwner(petitionId),
      ]);
      if (!isDefined(petition)) {
        throw new Error(`Petition:${petitionId} not found`);
      }
      if (!isDefined(owner)) {
        throw new Error(`Owner of petition Petition:${petitionId} not found`);
      }

      let documentTitle: Maybe<string> = null;
      if (isDefined(this.task.petition_access_id)) {
        // if the task was started by a recipient, the title of the PDF should be the message subject
        const [firstMessage] = await this.ctx.petitions.loadMessagesByPetitionAccessId(
          this.task.petition_access_id
        );
        documentTitle = firstMessage?.email_subject ?? null;
      } else {
        // if started by an user, use the title of the signing document or no title at all
        documentTitle = petition.signature_config?.title ?? null;
      }

      await this.onProgress(25);

      tmpFilePath = await this.ctx.petitionBinder.createBinder(owner.id, {
        petitionId,
        documentTitle,
        includeAnnexedDocuments: !skipAttachments,
        includeNetDocumentsLinks,
      });

      await this.onProgress(75);

      const tmpFile = await this.uploadTemporaryFile({
        stream: createReadStream(tmpFilePath),
        filename: sanitizeFilenameWithSuffix(documentTitle ?? "parallel", ".pdf"),
        contentType: "application/pdf",
      });

      return { temporary_file_id: tmpFile.id };
    } finally {
      try {
        if (isDefined(tmpFilePath)) {
          await unlink(tmpFilePath);
        }
      } catch {}
    }
  }
}
