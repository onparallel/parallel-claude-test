import fastSafeStringify from "fast-safe-stringify";
import { inject, injectable } from "inversify";
import { isNonNullish, isNullish } from "remeda";
import { CONFIG, Config } from "../../config";
import { TaskName } from "../../db/__types";
import { TaskRepository } from "../../db/repositories/TaskRepository";
import { FETCH_SERVICE, IFetchService } from "../../services/FetchService";
import { ILogger, LOGGER } from "../../services/Logger";
import { toGlobalId } from "../../util/globalId";
import { QueueWorker } from "../helpers/createQueueWorker";
import { HandledTaskRunnerError, TaskRunner } from "../helpers/TaskRunner";
import { BackgroundCheckProfilePdfRunner } from "./task-runners/BackgroundCheckProfilePdfRunner";
import { BackgroundCheckResultsPdfRunner } from "./task-runners/BackgroundCheckResultsPdfRunner";
import { BankflipSessionCompletedRunner } from "./task-runners/BankflipSessionCompletedRunner";
import { BulkPetitionSendRunner } from "./task-runners/BulkPetitionSendRunner";
import { ClosePetitionsRunner } from "./task-runners/ClosePetitionsRunner";
import { DashboardRefreshRunner } from "./task-runners/DashboardRefreshRunner";
import { DocumentProcessingRunner } from "./task-runners/DocumentProcessingRunner";
import { DowJonesProfileDownloadRunner } from "./task-runners/DowJonesProfileDownloadRunner";
import { ExportExcelRunner } from "./task-runners/ExportExcelRunner";
import { ExportRepliesRunner } from "./task-runners/ExportRepliesRunner";
import { FileExportRunner } from "./task-runners/FileExportRunner";
import { IdVerificationSessionCompletedRunner } from "./task-runners/IdVerificationSessionCompletedRunner";
import { PetitionSharingRunner } from "./task-runners/PetitionSharingRunner";
import { PetitionSummaryRunner } from "./task-runners/PetitionSummaryRunner";
import { PrintPdfRunner } from "./task-runners/PrintPdfRunner";
import { ProfileNamePatternUpdatedRunner } from "./task-runners/ProfileNamePatternUpdatedRunner";
import { ProfilesExcelExportRunner } from "./task-runners/ProfilesExcelExportRunner";
import { ProfilesExcelImportRunner } from "./task-runners/ProfilesExcelImportRunner";
import { ProfileSyncRunner } from "./task-runners/ProfileSyncRunner";
import { TemplateRepliesCsvExportRunner } from "./task-runners/TemplateRepliesCsvExportRunner";
import { TemplateRepliesReportRunner } from "./task-runners/TemplateRepliesReportRunner";
import { TemplatesOverviewReportRunner } from "./task-runners/TemplatesOverviewReportRunner";
import { TemplateStatsReportRunner } from "./task-runners/TemplateStatsReportRunner";

export type TaskWorkerPayload = {
  taskId: number;
  taskName: TaskName;
};

@injectable()
export class TaskWorkerQueue extends QueueWorker<TaskWorkerPayload> {
  private runners: Record<TaskName, TaskRunner>;
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(LOGGER) private logger: ILogger,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(TaskRepository) private tasks: TaskRepository,
    // ---- RUNNERS ---- //
    @inject(PrintPdfRunner) printPdfRunner: PrintPdfRunner,
    @inject(ExportRepliesRunner) exportRepliesRunner: ExportRepliesRunner,
    @inject(ExportExcelRunner) exportExcelRunner: ExportExcelRunner,
    @inject(TemplateRepliesReportRunner) templateRepliesReportRunner: TemplateRepliesReportRunner,
    @inject(TemplateStatsReportRunner) templateStatsReportRunner: TemplateStatsReportRunner,
    @inject(DowJonesProfileDownloadRunner)
    dowJonesProfileDownloadRunner: DowJonesProfileDownloadRunner,
    @inject(TemplatesOverviewReportRunner)
    templatesOverviewReportRunner: TemplatesOverviewReportRunner,
    @inject(BankflipSessionCompletedRunner)
    bankflipSessionCompletedRunner: BankflipSessionCompletedRunner,
    @inject(BulkPetitionSendRunner)
    bulkPetitionSendRunner: BulkPetitionSendRunner,
    @inject(TemplateRepliesCsvExportRunner)
    templateRepliesCsvExportRunner: TemplateRepliesCsvExportRunner,
    @inject(PetitionSummaryRunner)
    petitionSummaryRunner: PetitionSummaryRunner,
    @inject(BackgroundCheckProfilePdfRunner)
    backgroundCheckProfilePdfRunner: BackgroundCheckProfilePdfRunner,
    @inject(BackgroundCheckResultsPdfRunner)
    backgroundCheckResultsPdfRunner: BackgroundCheckResultsPdfRunner,
    @inject(PetitionSharingRunner)
    petitionSharingRunner: PetitionSharingRunner,
    @inject(ProfileNamePatternUpdatedRunner)
    profileNamePatternUpdatedRunner: ProfileNamePatternUpdatedRunner,
    @inject(IdVerificationSessionCompletedRunner)
    idVerificationSessionCompletedRunner: IdVerificationSessionCompletedRunner,
    @inject(FileExportRunner)
    fileExportRunner: FileExportRunner,
    @inject(ClosePetitionsRunner)
    closePetitionsRunner: ClosePetitionsRunner,
    @inject(ProfilesExcelImportRunner)
    profilesExcelImportRunner: ProfilesExcelImportRunner,
    @inject(ProfilesExcelExportRunner)
    profilesExcelExportRunner: ProfilesExcelExportRunner,
    @inject(DashboardRefreshRunner)
    dashboardRefreshRunner: DashboardRefreshRunner,
    @inject(DocumentProcessingRunner)
    documentProcessingRunner: DocumentProcessingRunner,
    @inject(ProfileSyncRunner)
    profileSyncRunner: ProfileSyncRunner,
  ) {
    super();
    this.runners = {
      PRINT_PDF: printPdfRunner,
      EXPORT_REPLIES: exportRepliesRunner,
      EXPORT_EXCEL: exportExcelRunner,
      TEMPLATE_REPLIES_REPORT: templateRepliesReportRunner,
      TEMPLATE_STATS_REPORT: templateStatsReportRunner,
      DOW_JONES_PROFILE_DOWNLOAD: dowJonesProfileDownloadRunner,
      TEMPLATES_OVERVIEW_REPORT: templatesOverviewReportRunner,
      BANKFLIP_SESSION_COMPLETED: bankflipSessionCompletedRunner,
      BULK_PETITION_SEND: bulkPetitionSendRunner,
      TEMPLATE_REPLIES_CSV_EXPORT: templateRepliesCsvExportRunner,
      PETITION_SUMMARY: petitionSummaryRunner,
      BACKGROUND_CHECK_PROFILE_PDF: backgroundCheckProfilePdfRunner,
      BACKGROUND_CHECK_RESULTS_PDF: backgroundCheckResultsPdfRunner,
      PETITION_SHARING: petitionSharingRunner,
      PROFILE_NAME_PATTERN_UPDATED: profileNamePatternUpdatedRunner,
      ID_VERIFICATION_SESSION_COMPLETED: idVerificationSessionCompletedRunner,
      FILE_EXPORT: fileExportRunner,
      CLOSE_PETITIONS: closePetitionsRunner,
      PROFILES_EXCEL_IMPORT: profilesExcelImportRunner,
      PROFILES_EXCEL_EXPORT: profilesExcelExportRunner,
      DASHBOARD_REFRESH: dashboardRefreshRunner,
      DOCUMENT_PROCESSING: documentProcessingRunner,
      PROFILE_SYNC: profileSyncRunner,
    };
  }

  override async handler({ taskId }: TaskWorkerPayload) {
    const task = await this.tasks.pickupTask(taskId, this.config.instanceName);
    if (isNullish(task)) {
      return;
    }

    const abort = new AbortController();
    let success = false;
    try {
      const output = await this.runners[task.name].run(task, { signal: abort.signal });
      await this.tasks.taskCompleted(task.id, output, this.config.instanceName);
      success = true;
    } catch (error) {
      abort.abort();

      if (error instanceof HandledTaskRunnerError) {
        // handled errors are not logged
        await this.tasks.taskFailed(
          task.id,
          { message: error.message, extra: error.extra },
          this.config.instanceName,
        );
      } else if (error instanceof Error) {
        this.logger.error(error.message, { stack: error.stack });
        await this.tasks.taskFailed(
          task.id,
          { message: error.message, stack: error.stack },
          this.config.instanceName,
        );
      } else {
        this.logger.error(`Unknnown Error ${fastSafeStringify(error)}`);
        await this.tasks.taskFailed(
          task.id,
          { message: `Unknown Error ${fastSafeStringify(error)}` },
          this.config.instanceName,
        );
      }
    } finally {
      try {
        if ("callback_url" in task.input && isNonNullish(task.input.callback_url)) {
          await this.fetch.fetch(
            task.input.callback_url,
            {
              method: "POST",
              body: JSON.stringify({
                success,
                taskId: toGlobalId("Task", task.id),
              }),
            },
            { timeout: 10_000 },
          );
        }
      } catch (e) {
        this.logger.info(`Error in callback request ${fastSafeStringify(e)}`);
      }
    }
  }
}
