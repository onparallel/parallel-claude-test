import { createReadStream } from "fs";
import { unlink } from "fs/promises";
import { isDefined } from "remeda";
import { sanitizeFilenameWithSuffix } from "../../util/sanitizeFilenameWithSuffix";
import { random } from "../../util/token";
import { Maybe } from "../../util/types";
import { TaskRunner } from "../helpers/TaskRunner";

export class PrintPdfRunner extends TaskRunner<"PRINT_PDF"> {
  async run() {
    let tmpFilePath: string | null = null;
    try {
      const { petition_id: petitionId, skip_attachments: skipAttachments } = this.task.input;

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

      let documentTitle: Maybe<string> | undefined;
      // if the task was started by a recipient, the title of the PDF should be the message subject instead of the petition name
      if (isDefined(this.task.petition_access_id)) {
        const [firstMessage] = await this.ctx.petitions.loadMessagesByPetitionAccessId(
          this.task.petition_access_id
        );
        documentTitle = firstMessage?.email_subject ?? undefined;
      } else {
        documentTitle = petition.name;
      }

      await this.onProgress(25);

      tmpFilePath = await this.ctx.petitionBinder.createBinder(owner.id, {
        petitionId,
        documentTitle: documentTitle ?? "",
        showSignatureBoxes: false,
        includeAnnexedDocuments: !skipAttachments,
      });

      await this.onProgress(75);

      const path = random(16);
      const res = await this.ctx.aws.temporaryFiles.uploadFile(
        path,
        "application/pdf",
        createReadStream(tmpFilePath)
      );
      const tmpFile = await this.ctx.files.createTemporaryFile(
        {
          path,
          content_type: "application/pdf",
          filename: sanitizeFilenameWithSuffix(documentTitle ?? "parallel", ".pdf"),
          size: res["ContentLength"]!.toString(),
        },
        `TaskWorker:${this.task.id}`
      );

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
