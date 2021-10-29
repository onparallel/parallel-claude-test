import { URLSearchParams } from "url";
import { WorkerContext } from "../../context";
import { Task } from "../../db/repositories/TaskRepository";
import { sanitizeFilenameWithSuffix } from "../../util/sanitizeFilenameWithSuffix";
import { random } from "../../util/token";
import { TaskUpdateHandler } from "../task-worker";

export async function runPrintPdfTask(
  task: Task<"PRINT_PDF">,
  ctx: WorkerContext,
  onUpdate: TaskUpdateHandler<"PRINT_PDF">
) {
  try {
    const { petitionId } = task.input;
    const hasAccess = await ctx.petitions.userHasAccessToPetitions(task.user_id, [petitionId]);
    if (!hasAccess) {
      return;
    }
    const petition = (await ctx.petitions.loadPetition(petitionId))!;
    const token = ctx.security.generateAuthToken({
      petitionId,
    });

    onUpdate(25);

    const buffer = await ctx.printer.pdf(
      `http://localhost:3000/${petition.locale}/print/petition-pdf?${new URLSearchParams({
        token,
      })}`
    );

    onUpdate(75);

    const path = random(16);
    const res = await ctx.aws.temporaryFiles.uploadFile(path, "application/pdf", buffer);
    const tmpFile = await ctx.files.createTemporaryFile(
      {
        path,
        content_type: "application/pdf",
        filename: sanitizeFilenameWithSuffix(petition!.name ?? "parallel", ".pdf"),
        size: res["ContentLength"]!.toString(),
      },
      `TaskWorker:${task.id}`
    );

    const url = await ctx.aws.temporaryFiles.getSignedDownloadEndpoint(
      tmpFile.path,
      tmpFile.filename,
      "inline"
    );

    onUpdate(100, undefined, { url });
  } catch (error: any) {
    onUpdate(null, { message: error.message });
  }
}
