import { isDefined } from "remeda";
import { WorkerContext } from "../context";
import { TaskName } from "../db/__types";
import { Task } from "../db/repositories/TaskRepository";
import { TaskRunner } from "./helpers/TaskRunner";
import { createQueueWorker } from "./helpers/createQueueWorker";
import { BankflipSessionCompletedRunner } from "./tasks/BankflipSessionCompletedRunner";
import { BulkPetitionSendRunner } from "./tasks/BulkPetitionSendRunner";
import { DowJonesProfileDownloadRunner } from "./tasks/DowJonesProfileDownloadRunner";
import { ExportExcelRunner } from "./tasks/ExportExcelRunner";
import { ExportRepliesRunner } from "./tasks/ExportRepliesRunner";
import { PrintPdfRunner } from "./tasks/PrintPdfRunner";
import { TemplateRepliesReportRunner } from "./tasks/TemplateRepliesReportRunner";
import { TemplateStatsReportRunner } from "./tasks/TemplateStatsReportRunner";
import { TemplatesOverviewReportRunner } from "./tasks/TemplatesOverviewReportRunner";
import { TemplateRepliesCsvExportRunner } from "./tasks/TemplateRepliesCsvExportRunner";

const RUNNERS: Record<TaskName, new (ctx: WorkerContext, task: Task<any>) => TaskRunner<any>> = {
  PRINT_PDF: PrintPdfRunner,
  EXPORT_REPLIES: ExportRepliesRunner,
  EXPORT_EXCEL: ExportExcelRunner,
  TEMPLATE_REPLIES_REPORT: TemplateRepliesReportRunner,
  TEMPLATE_STATS_REPORT: TemplateStatsReportRunner,
  DOW_JONES_PROFILE_DOWNLOAD: DowJonesProfileDownloadRunner,
  TEMPLATES_OVERVIEW_REPORT: TemplatesOverviewReportRunner,
  BANKFLIP_SESSION_COMPLETED: BankflipSessionCompletedRunner,
  BULK_PETITION_SEND: BulkPetitionSendRunner,
  TEMPLATE_REPLIES_CSV_EXPORT: TemplateRepliesCsvExportRunner,
};

export interface TaskWorkerPayload {
  taskId: number;
}

createQueueWorker(
  "task-worker",
  async ({ taskId }, ctx) => {
    const task = await ctx.tasks.pickupTask(taskId, ctx.config.instanceName);
    if (!isDefined(task)) {
      return;
    }
    const Runner = RUNNERS[task.name];
    await new Runner(ctx, task).runTask();
  },
  {
    forkHandlers: true,
    forkTimeout: 1_800_000, // 30 min timeout for BulkPetitionSendRunner
    async onForkTimeout({ taskId }, ctx) {
      await ctx.tasks.taskFailed(taskId, { message: "Timeout" }, ctx.config.instanceName);
    },
  },
);
