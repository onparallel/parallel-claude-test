import { countBy, partition } from "remeda";
import { fromGlobalId } from "../../util/globalId";
import { TaskRunner } from "../helpers/TaskRunner";

export class TemplatesOverviewReportRunner extends TaskRunner<"TEMPLATES_OVERVIEW_REPORT"> {
  async run() {
    if (!this.task.user_id) {
      throw new Error(`Task ${this.task.id} is missing user_id`);
    }

    const user = await this.ctx.users.loadUser(this.task.user_id);

    const { start_date: startDate, end_date: endDate } = this.task.input;
    const userPetitions = await this.ctx.petitions.getUserPetitionsForOverviewReport(
      this.task.user_id,
      startDate,
      endDate
    );

    const [petitions, templates] = partition(userPetitions, (p) => !p.is_template);
    const templateIds = templates.map((t) => t.id);
    const templateStats = await this.ctx.petitions.getPetitionStatsByFromTemplateId(
      templateIds,
      user!.org_id,
      startDate,
      endDate
    );
    return {
      total: petitions.length,
      closed: countBy(petitions, (p) => p.status === "CLOSED"),
      completed: countBy(petitions, (p) => p.status === "COMPLETED"),
      signed: countBy(petitions, (p) => p.latest_signature_status === "COMPLETED"),
      templates: templateStats.map((stats) => {
        const templateId = fromGlobalId(stats.template_id, "Petition").id;
        return {
          name: templates.find((t) => t.id === templateId)?.name ?? null,
          ...stats,
        };
      }),
    };
  }
}
