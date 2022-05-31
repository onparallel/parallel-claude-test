import { TaskRunner } from "../helpers/TaskRunner";

export class TemplateStatsReportRunner extends TaskRunner<"TEMPLATE_STATS_REPORT"> {
  async run() {
    return {
      pending: 60,
      completed: 40,
      closed: 50,
      pending_to_complete: 3321312,
      complete_to_close: 3123213213,
      signatures: {
        completed: 100,
        time_to_complete: 123123,
      },
    };
  }
}
