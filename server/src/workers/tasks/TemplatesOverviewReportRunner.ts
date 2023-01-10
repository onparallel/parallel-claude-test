import { TaskRunner } from "../helpers/TaskRunner";

export class TemplatesOverviewReportRunner extends TaskRunner<"TEMPLATES_OVERVIEW_REPORT"> {
  async run() {
    return {
      total: 1,
      closed: 0,
      completed: 0,
      signed: 0,
      template_status: [],
      template_times: [],
    };
  }
}
