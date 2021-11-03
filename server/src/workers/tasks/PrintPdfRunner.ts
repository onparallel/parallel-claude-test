import { URLSearchParams } from "url";
import { sanitizeFilenameWithSuffix } from "../../util/sanitizeFilenameWithSuffix";
import { random } from "../../util/token";
import { TaskRunner } from "../helpers/TaskRunner";

export class PrintPdfRunner extends TaskRunner<"PRINT_PDF"> {
  async run() {
    const { petition_id: petitionId } = this.task.input;
    const hasAccess = await this.ctx.petitions.userHasAccessToPetitions(this.task.user_id, [
      petitionId,
    ]);
    if (!hasAccess) {
      throw new Error(`User ${this.task.user_id} has no access to petition ${petitionId}`);
    }
    const petition = (await this.ctx.petitions.loadPetition(petitionId))!;
    const token = this.ctx.security.generateAuthToken({
      petitionId,
    });

    await this.onProgress(25);

    const buffer = await this.ctx.printer.pdf(
      `http://localhost:3000/${petition.locale}/print/petition-pdf?${new URLSearchParams({
        token,
      })}`
    );

    await this.onProgress(75);

    const path = random(16);
    const res = await this.ctx.aws.temporaryFiles.uploadFile(path, "application/pdf", buffer);
    const tmpFile = await this.ctx.files.createTemporaryFile(
      {
        path,
        content_type: "application/pdf",
        filename: sanitizeFilenameWithSuffix(petition!.name ?? "parallel", ".pdf"),
        size: res["ContentLength"]!.toString(),
      },
      `TaskWorker:${this.task.id}`
    );

    return { temporary_file_id: tmpFile.id };
  }
}
