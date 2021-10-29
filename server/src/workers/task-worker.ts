import { WorkerContext } from "../context";
import { Task, TaskOutput } from "../db/repositories/TaskRepository";
import { TaskName } from "../db/__types";
import { createQueueWorker } from "./helpers/createQueueWorker";
import { runExportRepliesTask } from "./helpers/runExportRepliesTask";
import { runPrintPdfTask } from "./helpers/runPrintPdfTask";

export type TaskUpdateHandler<TName extends TaskName> = (
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

createQueueWorker("task-worker", async (payload: { taskId: number }, ctx) => {
  const task = await ctx.task.loadTask(payload.taskId);
  if (!task) return;

  try {
    switch (task.name) {
      case "PRINT_PDF":
        runPrintPdfTask(task, ctx, taskUpdateHandler(task, ctx));
        break;
      case "EXPORT_REPLIES":
        runExportRepliesTask(task, ctx, taskUpdateHandler(task, ctx));
        break;
      default:
        break;
    }
  } catch (error: any) {
    ctx.logger.error(error.message, { stack: error.stack });
  }
});
