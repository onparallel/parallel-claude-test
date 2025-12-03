import { inject, injectable } from "inversify";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { Config, CONFIG } from "../../../config";
import { DashboardRepository } from "../../../db/repositories/DashboardRepository";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import { ILogger, LOGGER } from "../../../services/Logger";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { TaskRunner } from "../../helpers/TaskRunner";

@injectable()
export class DashboardRefreshRunner extends TaskRunner<"DASHBOARD_REFRESH"> {
  constructor(
    @inject(DashboardRepository) private dashboards: DashboardRepository,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }
  async run(task: Task<"DASHBOARD_REFRESH">) {
    const { dashboard_id: dashboardId } = task.input;

    assert(task.user_id, "User ID is required");
    const updatedBy = `User:${task.user_id}`;

    const dashboard = await this.dashboards.loadDashboard(dashboardId);
    if (!dashboard) {
      return { success: false };
    }

    const modules = await this.dashboards.loadModulesByDashboardId(dashboardId);

    try {
      for (const module of modules) {
        let result: any;
        switch (module.type) {
          case "PETITIONS_NUMBER":
            result = await this.dashboards.getPetitionsNumberValue(
              dashboard.org_id,
              module.settings,
            );
            break;
          case "PROFILES_NUMBER":
            result = await this.dashboards.getProfilesNumberValue(
              dashboard.org_id,
              module.settings,
            );
            break;
          case "PETITIONS_RATIO":
            result = await this.dashboards.getPetitionsRatioValues(
              dashboard.org_id,
              module.settings,
            );
            break;
          case "PROFILES_RATIO":
            result = await this.dashboards.getProfilesRatioValues(
              dashboard.org_id,
              module.settings,
            );
            break;
          case "PETITIONS_PIE_CHART":
            result = await this.dashboards.getPetitionsPieChartValues(
              dashboard.org_id,
              module.settings,
            );
            break;
          case "PROFILES_PIE_CHART":
            result = await this.dashboards.getProfilesPieChartValues(
              dashboard.org_id,
              module.settings,
            );
            break;
        }
        if (isNonNullish(result)) {
          await this.dashboards.updateDashboardModule(module.id, { result }, updatedBy);
        }
      }

      return {
        success: true,
      };
    } finally {
      // even if the refresh fails, we still update the refresh status of the dashboard to stop polling in frontend
      await this.dashboards.updateDashboardRefreshStatus(dashboardId, updatedBy);
    }
  }
}
