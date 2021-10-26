import { URLSearchParams } from "url";
import { WorkerContext } from "../context";
import { Task } from "../db/repositories/TaskRepository";
import { fromGlobalId } from "../util/globalId";
import { sanitizeFilenameWithSuffix } from "../util/sanitizeFilenameWithSuffix";
import { random } from "../util/token";
import { createQueueWorker } from "./helpers/createQueueWorker";

function updateTaskProgress(taskId: number, progress: number, ctx: WorkerContext) {
  ctx.task.updateTask(taskId, { progress }, `TaskWorker:${taskId}`);
}

async function runPrintPdfTask(task: Task<"PRINT_PDF">, ctx: WorkerContext) {
  const { id: petitionId } = fromGlobalId(task.input.petitionId, "Petition");
  const hasAccess = await ctx.petitions.userHasAccessToPetitions(task.user_id, [petitionId]);
  if (!hasAccess) {
    return;
  }
  const petition = (await ctx.petitions.loadPetition(petitionId))!;
  const token = ctx.security.generateAuthToken({
    petitionId,
  });

  updateTaskProgress(task.id, 25, ctx);

  const buffer = await ctx.printer.pdf(
    `http://localhost:3000/${petition.locale}/print/petition-pdf?${new URLSearchParams({
      token,
    })}`,
    {
      height: "297mm",
      width: "210mm",
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
      },
    }
  );

  updateTaskProgress(task.id, 50, ctx);

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

  updateTaskProgress(task.id, 75, ctx);

  const publicDownloadUrl = await ctx.aws.temporaryFiles.getSignedDownloadEndpoint(
    tmpFile.path,
    tmpFile.filename,
    "inline"
  );

  await ctx.task.updateTask<"PRINT_PDF">(
    task.id,
    {
      progress: 100,
      output: { url: publicDownloadUrl },
    },
    `TaskWorker:${task.id}`
  );
}

createQueueWorker("task-worker", async (payload: { taskId: number }, ctx) => {
  const task = await ctx.task.loadTask(payload.taskId);
  if (!task) return;

  try {
    await ctx.task.updateTask(task.id, { status: "PROCESSING" }, `TaskWorker:${task.id}`);
    switch (task.name) {
      case "PRINT_PDF":
        await runPrintPdfTask(task, ctx);
        break;
      default:
        break;
    }
    await ctx.task.updateTask(task.id, { status: "COMPLETED" }, `TaskWorker:${task.id}`);
  } catch (error: any) {
    ctx.logger.error(error.message, { stack: error.stack });
    await ctx.task.updateTask(
      task.id,
      { status: "CANCELLED", cancel_data: { message: error.message } },
      `TaskWorker:${task.id}`
    );
  }
});
