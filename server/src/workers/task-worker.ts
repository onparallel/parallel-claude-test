import { isDefined } from "remeda";
import { WorkerContext } from "../context";
import { Task } from "../db/repositories/TaskRepository";
import { TaskName } from "../db/__types";
import { createQueueWorker } from "./helpers/createQueueWorker";
import { TaskRunner } from "./helpers/TaskRunner";
import { ExportExcelRunner } from "./tasks/ExportExcelRunner";
import { ExportRepliesRunner } from "./tasks/ExportRepliesRunner";
import { TemplateRepliesReportRunner } from "./tasks/TemplateRepliesReportRunner";
import { PrintPdfRunner } from "./tasks/PrintPdfRunner";

const RUNNERS: Record<TaskName, new (ctx: WorkerContext, task: Task<any>) => TaskRunner<any>> = {
  PRINT_PDF: PrintPdfRunner,
  EXPORT_REPLIES: ExportRepliesRunner,
  EXPORT_EXCEL: ExportExcelRunner,
  TEMPLATE_REPLIES_REPORT: TemplateRepliesReportRunner,
};

createQueueWorker("task-worker", async ({ taskId }: { taskId: number }, ctx) => {
  try {
    const task = await ctx.tasks.pickupTask(taskId, `TaskWorker:${taskId}`);
    if (!isDefined(task)) {
      return;
    }
    const Runner = RUNNERS[task.name as TaskName];
    const output = await new Runner(ctx, task).run();

    await ctx.tasks.taskCompleted(taskId, output, `TaskWorker:${taskId}`);
  } catch (error: any) {
    ctx.logger.error(error.message, { stack: error.stack });
    await ctx.tasks.taskFailed(
      taskId,
      { message: error.message, stack: error.stack },
      `TaskWorker:${taskId}`
    );
  }
});
