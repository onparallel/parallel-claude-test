import { TaskRunner } from "../helpers/TaskRunner";

export class TemplateStatsReportRunner extends TaskRunner<"TEMPLATE_STATS_REPORT"> {
  async run() {
    const { template_id: templateId, start_date: startDate, end_date: endDate } = this.task.input;

    const [user, hasAccess] = await Promise.all([
      this.ctx.readonlyUsers.loadUser(this.task.user_id!),
      this.ctx.readonlyPetitions.userHasAccessToPetitions(this.task.user_id!, [templateId]),
    ]);

    if (!hasAccess) {
      throw new Error(`User ${this.task.user_id} has no access to template ${templateId}`);
    }

    const [data] = await this.ctx.readonlyPetitions.getPetitionStatsByFromTemplateId(
      [templateId],
      user!.org_id,
      startDate,
      endDate
    );

    return data;
  }
}
