import { inject, injectable } from "inversify";
import pMap from "p-map";
import { assert } from "ts-essentials";
import { Config, CONFIG } from "../../../config";
import { FileExportLog } from "../../../db/__types";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { IntegrationRepository } from "../../../db/repositories/IntegrationRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import {
  FileExport,
  IFileExportIntegration,
} from "../../../integrations/file-export/FileExportIntegration";
import { IMANAGE_FILE_EXPORT_INTEGRATION } from "../../../integrations/file-export/imanage/IManageFileExportIntegration";
import { ILogger, LOGGER } from "../../../services/Logger";
import {
  PETITION_FILES_SERVICE,
  PetitionFilesService,
} from "../../../services/PetitionFilesService";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { never } from "../../../util/never";
import { random } from "../../../util/token";
import { TaskRunner } from "../../helpers/TaskRunner";

@injectable()
export class FileExportRunner extends TaskRunner<"FILE_EXPORT"> {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(PETITION_FILES_SERVICE) private petitionFiles: PetitionFilesService,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(IMANAGE_FILE_EXPORT_INTEGRATION) private iManageExport: IFileExportIntegration,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }

  async run(task: Task<"FILE_EXPORT">) {
    const { integration_id: integrationId, petition_id: petitionId, pattern } = task.input;

    if (!task.user_id) {
      throw new Error(`Task ${task.id} is missing user_id`);
    }

    const hasAccess = await this.petitions.userHasAccessToPetitions(task.user_id, [petitionId]);
    if (!hasAccess) {
      throw new Error(`User ${task.user_id} has no access to petition ${petitionId}`);
    }

    const log = await this.createPetitionFilesExportLog(
      task,
      integrationId,
      petitionId,
      pattern,
      task.user_id,
    );

    return {
      file_export_log_id: log.id,
      window_url: await this.buildWindowUrl(integrationId, log.id),
    };
  }

  private async createPetitionFilesExportLog(
    task: Task<"FILE_EXPORT">,
    integrationId: number,
    petitionId: number,
    filenamePattern: string | null,
    userId: number,
  ): Promise<FileExportLog> {
    const userData = await this.users.loadUserDataByUserId(userId);
    assert(userData, `User ${userId} not found`);
    const files = await this.petitionFiles.getPetitionFiles(petitionId, userId, {
      include: [
        "PETITION_EXCEL_EXPORT",
        "PETITION_FILE_FIELD_REPLIES",
        "PETITION_LATEST_SIGNATURE",
      ],
      locale: userData.preferred_locale,
      pattern: filenamePattern,
    });

    let progress = 0;
    const exportedFiles = await pMap(
      files,
      async (f) => {
        this.logger.info(
          `[FileExportRunner:${task.id}]: ${Math.round((progress / files.length) * 100)}%`,
        );
        const temporaryUrl = await f.getDownloadUrl();
        await this.onProgress(task, (++progress / files.length) * 100 * 0.95);

        return {
          id: random(16),
          status: "WAITING",
          metadata: f.metadata,
          filename: f.filename,
          temporary_url: temporaryUrl,
        } as FileExport;
      },
      { concurrency: 1 },
    );

    if (exportedFiles.length === 0) {
      throw new Error(`No files to export on Petition:${petitionId}`);
    }

    return await this.integrations.createFileExportLog(
      {
        integration_id: integrationId,
        created_by_user_id: userId,
        json_export: exportedFiles,
      },
      `User:${userId}`,
    );
  }

  private async buildWindowUrl(integrationId: number, fileExportLogId: number) {
    const integration = await this.integrations.loadIntegration(integrationId);
    assert(integration?.type === "FILE_EXPORT", "Invalid integration");

    const client =
      integration.provider === "IMANAGE"
        ? this.iManageExport
        : never(`Provider ${integration.provider} not supported`);

    return await client.buildWindowUrl(integrationId, fileExportLogId);
  }
}
