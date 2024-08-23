import { isNullish } from "remeda";
import { WorkerContext } from "../context";
import { TaskName } from "../db/__types";
import { Task } from "../db/repositories/TaskRepository";
import { TaskRunner } from "./helpers/TaskRunner";
import { createQueueWorker } from "./helpers/createQueueWorker";
import { BackgroundCheckProfilePdfRunner } from "./tasks/BackgroundCheckProfilePdfRunner";
import { BankflipSessionCompletedRunner } from "./tasks/BankflipSessionCompletedRunner";
import { BulkPetitionSendRunner } from "./tasks/BulkPetitionSendRunner";
import { DowJonesProfileDownloadRunner } from "./tasks/DowJonesProfileDownloadRunner";
import { ExportExcelRunner } from "./tasks/ExportExcelRunner";
import { ExportRepliesRunner } from "./tasks/ExportRepliesRunner";
import { IdVerificationSessionCompletedRunner } from "./tasks/IdVerificationSessionCompletedRunner";
import { PetitionSharingRunner } from "./tasks/PetitionSharingRunner";
import { PetitionSummaryRunner } from "./tasks/PetitionSummaryRunner";
import { PrintPdfRunner } from "./tasks/PrintPdfRunner";
import { ProfileNamePatternUpdatedRunner } from "./tasks/ProfileNamePatternUpdatedRunner";
import { TemplateRepliesCsvExportRunner } from "./tasks/TemplateRepliesCsvExportRunner";
import { TemplateRepliesReportRunner } from "./tasks/TemplateRepliesReportRunner";
import { TemplateStatsReportRunner } from "./tasks/TemplateStatsReportRunner";
import { TemplatesOverviewReportRunner } from "./tasks/TemplatesOverviewReportRunner";

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
  PETITION_SUMMARY: PetitionSummaryRunner,
  BACKGROUND_CHECK_PROFILE_PDF: BackgroundCheckProfilePdfRunner,
  PETITION_SHARING: PetitionSharingRunner,
  PROFILE_NAME_PATTERN_UPDATED: ProfileNamePatternUpdatedRunner,
  ID_VERIFICATION_SESSION_COMPLETED: IdVerificationSessionCompletedRunner,
};

export interface TaskWorkerPayload {
  taskId: number;
}

createQueueWorker(
  "task-worker",
  async ({ taskId }, ctx) => {
    const task = await ctx.tasks.pickupTask(taskId, ctx.config.instanceName);
    if (isNullish(task)) {
      return;
    }
    const Runner = RUNNERS[task.name];
    await new Runner(ctx, task).runTask();
  },
  {
    batchSize: 1,
    forkHandlers: true,
    forkTimeout: async ({ taskId }, ctx) => {
      const task = await ctx.tasks.loadTask(taskId);
      if (task?.name === "BULK_PETITION_SEND") {
        return 30 * 60_000;
      } else {
        return 2 * 60_000;
      }
    },
    async onForkError(signal, { taskId }, ctx) {
      await ctx.tasks.taskFailed(taskId, { message: signal }, ctx.config.instanceName);
    },
  },
);
