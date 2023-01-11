import { isDefined } from "remeda";
import { WorkerContext } from "../context";
import { Task } from "../db/repositories/TaskRepository";
import { TaskName } from "../db/__types";
import { createQueueWorker } from "./helpers/createQueueWorker";
import { TaskRunner } from "./helpers/TaskRunner";
import { DowJonesProfileDownloadRunner } from "./tasks/DowJonesProfileDownloadRunner";
import { ExportExcelRunner } from "./tasks/ExportExcelRunner";
import { ExportRepliesRunner } from "./tasks/ExportRepliesRunner";
import { PrintPdfRunner } from "./tasks/PrintPdfRunner";
import { TemplateRepliesReportRunner } from "./tasks/TemplateRepliesReportRunner";
import { TemplatesOverviewReportRunner } from "./tasks/TemplatesOverviewReportRunner";
import { TemplateStatsReportRunner } from "./tasks/TemplateStatsReportRunner";

const RUNNERS: Record<TaskName, new (ctx: WorkerContext, task: Task<any>) => TaskRunner<any>> = {
  PRINT_PDF: PrintPdfRunner,
  EXPORT_REPLIES: ExportRepliesRunner,
  EXPORT_EXCEL: ExportExcelRunner,
  TEMPLATE_REPLIES_REPORT: TemplateRepliesReportRunner,
  TEMPLATE_STATS_REPORT: TemplateStatsReportRunner,
  DOW_JONES_PROFILE_DOWNLOAD: DowJonesProfileDownloadRunner,
  TEMPLATES_OVERVIEW_REPORT: TemplatesOverviewReportRunner,
};

export type TaskWorkerPayload = {
  taskId: number;
};

createQueueWorker("task-worker", async ({ taskId }, ctx) => {
  const task = await ctx.tasks.pickupTask(taskId, `TaskWorker:${taskId}`);
  if (!isDefined(task)) {
    return;
  }
  const Runner = RUNNERS[task.name];
  await new Runner(ctx, task).runTask();
});
