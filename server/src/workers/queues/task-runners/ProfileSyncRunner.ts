import fastSafeStringify from "fast-safe-stringify";
import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../../../config";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { IntegrationRepository } from "../../../db/repositories/IntegrationRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import {
  SAP_PROFILE_SYNC_INTEGRATION_FACTORY,
  SapProfileSyncIntegrationFactory,
} from "../../../integrations/profile-sync/sap/SapProfileSyncIntegration";
import { ILogger, LOGGER } from "../../../services/Logger";
import { IRedis, REDIS } from "../../../services/Redis";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { TaskRunner } from "../../helpers/TaskRunner";

@injectable()
export class ProfileSyncRunner extends TaskRunner<"PROFILE_SYNC"> {
  constructor(
    @inject(SAP_PROFILE_SYNC_INTEGRATION_FACTORY)
    private sapProfileSyncIntegrationFactory: SapProfileSyncIntegrationFactory,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(REDIS) private redis: IRedis,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }

  async run(task: Task<"PROFILE_SYNC">) {
    const { type, integration_id: integrationId, output } = task.input;
    try {
      const integration = this.sapProfileSyncIntegrationFactory(integrationId, output);

      switch (type) {
        case "INITIAL":
          await using lock = await this.redis.withLock({
            key: `sap-profile-sync:${integrationId}`,
            maxTime: 60 * 60,
          });
          if (lock.alreadyLocked) {
            return { success: false, error: { message: "Sync already in progress" } };
          }
          await integration.initialSync();
          break;
        default:
          throw new Error(`Unimplemented sync type: ${type}`);
      }

      const logs = await this.integrations.loadProfileSyncLogByIntegrationId(integrationId);
      const latestLog = logs.at(-1);

      return {
        success: latestLog?.status === "COMPLETED",
        profile_sync_log_id: latestLog?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: fastSafeStringify(error),
      };
    }
  }
}
