import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { TaskRunner } from "../helpers/TaskRunner";

export class DashboardRefreshRunner extends TaskRunner<"DASHBOARD_REFRESH"> {
  protected override async run({ signal }: { signal: AbortSignal }) {
    const { dashboard_id: dashboardId } = this.task.input;

    assert(this.task.user_id, "User ID is required");
    const updatedBy = `User:${this.task.user_id}`;

    const dashboard = await this.ctx.dashboards.loadDashboard(dashboardId);
    if (!dashboard) {
      return { success: false };
    }

    const modules = await this.ctx.dashboards.loadModulesByDashboardId(dashboardId);

    try {
      for (const module of modules) {
        let result: any;
        switch (module.type) {
          case "PETITIONS_NUMBER":
            result = await this.ctx.dashboards.getPetitionsNumberValue(
              dashboard.org_id,
              module.settings,
            );
            break;
          case "PROFILES_NUMBER":
            result = await this.ctx.dashboards.getProfilesNumberValue(
              dashboard.org_id,
              module.settings,
            );
            break;
          case "PETITIONS_RATIO":
            result = await this.ctx.dashboards.getPetitionsRatioValues(
              dashboard.org_id,
              module.settings,
            );
            break;
          case "PROFILES_RATIO":
            result = await this.ctx.dashboards.getProfilesRatioValues(
              dashboard.org_id,
              module.settings,
            );
            break;
          case "PETITIONS_PIE_CHART":
            result = await this.ctx.dashboards.getPetitionsPieChartValues(
              dashboard.org_id,
              module.settings,
            );
            break;
          case "PROFILES_PIE_CHART":
            result = await this.ctx.dashboards.getProfilesPieChartValues(
              dashboard.org_id,
              module.settings,
            );
            break;
        }
        if (isNonNullish(result)) {
          await this.ctx.dashboards.updateDashboardModule(module.id, { result }, updatedBy);
        }
      }

      return {
        success: true,
      };
    } finally {
      // even if the refresh fails, we still update the refresh status of the dashboard to stop polling in frontend
      await this.ctx.dashboards.updateDashboardRefreshStatus(dashboardId, updatedBy);
    }
  }
}
