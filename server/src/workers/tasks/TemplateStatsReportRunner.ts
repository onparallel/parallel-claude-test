import { TaskRunner } from "../helpers/TaskRunner";

export class TemplateStatsReportRunner extends TaskRunner<"TEMPLATE_STATS_REPORT"> {
  async run() {
    const { template_id: templateId } = this.task.input;

    const [user, hasAccess] = await Promise.all([
      this.ctx.users.loadUser(this.task.user_id!),
      this.ctx.petitions.userHasAccessToPetitions(this.task.user_id!, [templateId]),
    ]);

    if (!hasAccess) {
      throw new Error(`User ${this.task.user_id} has no access to template ${templateId}`);
    }

    return await this.ctx.petitions.getPetitionStatsByFromTemplateId(templateId, user!.org_id);
  }
}
