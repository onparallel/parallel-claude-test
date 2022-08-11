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
import { TemplateStatsReportRunner } from "./tasks/TemplateStatsReportRunner";

const RUNNERS: Record<TaskName, new (ctx: WorkerContext, task: Task<any>) => TaskRunner<any>> = {
  PRINT_PDF: PrintPdfRunner,
  EXPORT_REPLIES: ExportRepliesRunner,
  EXPORT_EXCEL: ExportExcelRunner,
  TEMPLATE_REPLIES_REPORT: TemplateRepliesReportRunner,
  TEMPLATE_STATS_REPORT: TemplateStatsReportRunner,
};

createQueueWorker("task-worker", async ({ taskId }: { taskId: number }, ctx) => {
  const task = await ctx.tasks.pickupTask(taskId, `TaskWorker:${taskId}`);
  if (!isDefined(task)) {
    return;
  }
  const Runner = RUNNERS[task.name as TaskName];
  await new Runner(ctx, task).runTask();
});
