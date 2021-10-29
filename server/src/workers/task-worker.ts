import { URLSearchParams } from "url";
import { WorkerContext } from "../context";
import { Task, TaskOutput } from "../db/repositories/TaskRepository";
import { TaskName } from "../db/__types";
import { sanitizeFilenameWithSuffix } from "../util/sanitizeFilenameWithSuffix";
import { random } from "../util/token";
import { createQueueWorker } from "./helpers/createQueueWorker";

type TaskUpdateHandler<TName extends TaskName> = (
  progress: number | null,
  error?: any,
  output?: TaskOutput<TName>
) => void;

function taskUpdateHandler<TName extends TaskName>(
  task: Task<TName>,
  ctx: WorkerContext
): TaskUpdateHandler<TName> {
  return (progress, error, output) => {
    ctx.task.updateTask(
      task.id,
      {
        progress,
        status: error ? "CANCELLED" : progress === 100 ? "COMPLETED" : "PROCESSING",
        cancel_data: error,
        output,
      },
      `TaskWorker:${task.id}`
    );
  };
}

async function runPrintPdfTask(
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

createQueueWorker("task-worker", async (payload: { taskId: number }, ctx) => {
  const task = await ctx.task.loadTask(payload.taskId);
  if (!task) return;

  try {
    switch (task.name) {
      case "PRINT_PDF":
        runPrintPdfTask(task, ctx, taskUpdateHandler(task, ctx));
        break;
      default:
        break;
    }
  } catch (error: any) {
    ctx.logger.error(error.message, { stack: error.stack });
  }
});
