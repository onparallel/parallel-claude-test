import { TaskRunner } from "../helpers/TaskRunner";

export class TemplatesOverviewReportRunner extends TaskRunner<"TEMPLATES_OVERVIEW_REPORT"> {
  async run() {
    if (!this.task.user_id) {
      throw new Error(`Task ${this.task.id} is missing user_id`);
    }
    const user = await this.ctx.users.loadUser(this.task.user_id);
    const { start_date: startDate, end_date: endDate } = this.task.input;
    return await this.ctx.readonlyPetitions.getPetitionStatsOverview(
      user!.org_id,
      user!.id,
      startDate,
      endDate,
    );
  }
}
