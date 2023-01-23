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
      totals: {
        all: petitions.length,
        pending: countBy(petitions, (p) => p.status === "PENDING"),
        completed: countBy(petitions, (p) => p.status === "COMPLETED"),
        closed: countBy(petitions, (p) => p.status === "CLOSED"),
        signed: countBy(petitions, (p) => p.latest_signature_status === "COMPLETED"),
      },
      templates: templateStats,
      // other_templates: {
      //   status: { all: 0, pending: 0, completed: 0, closed: 0, signed: 0 },
      //   times: {
      //     pending_to_complete: null,
      //     complete_to_close: null,
      //     signature_completed: null,
      //   },
      // },
      // petitions_scratch: {
      //   status: { all: 0, pending: 0, completed: 0, closed: 0, signed: 0 },
      //   times: {
      //     pending_to_complete: null,
      //     complete_to_close: null,
      //     signature_completed: null,
      //   },
      // },
    };
  }
}
