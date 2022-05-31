import { TaskRunner } from "../helpers/TaskRunner";

export class TemplateStatsReportRunner extends TaskRunner<"TEMPLATE_STATS_REPORT"> {
  async run() {
    const { template_id: templateId } = this.task.input;

    const user = await this.ctx.users.loadUser(this.task.user_id!);
    return await this.ctx.petitions.getPetitionStatsByFromTemplateId(templateId, user!.org_id);
  }
}
