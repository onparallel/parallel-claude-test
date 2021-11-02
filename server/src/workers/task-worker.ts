import { isDefined } from "remeda";
import { WorkerContext } from "../context";
import { Task } from "../db/repositories/TaskRepository";
import { TaskName } from "../db/__types";
import { createQueueWorker } from "./helpers/createQueueWorker";
import { TaskRunner } from "./helpers/TaskRunner";
import { ExportRepliesRunner } from "./tasks/ExportRepliesRunner";
import { PrintPdfRunner } from "./tasks/PrintPdfRunner";

const RUNNERS: Record<TaskName, new (ctx: WorkerContext, task: Task<any>) => TaskRunner<any>> = {
  PRINT_PDF: PrintPdfRunner,
  EXPORT_REPLIES: ExportRepliesRunner,
};

createQueueWorker("task-worker", async (payload: { taskId: number }, ctx) => {
  const task = await ctx.tasks.loadTask(payload.taskId);
  if (!isDefined(task)) {
    return;
  }
  try {
    await ctx.tasks.updateTask(
      task.id,
      { status: "PROCESSING", progress: 0 },
      `TaskWorker:${task.id}`
    );
    const Runner = RUNNERS[task.name];
    const result = await new Runner(ctx, task).run();
    await ctx.tasks.updateTask(
      task.id,
      { status: "COMPLETED", progress: 100, output: result },
      `TaskWorker:${task.id}`
    );
  } catch (error: any) {
    ctx.logger.error(error.message, { stack: error.stack });
    await ctx.tasks.updateTask(
      task.id,
      { status: "FAILED", error_data: { message: error.message, stack: error.stack } },
      `TaskWorker:${task.id}`
    );
  }
});
