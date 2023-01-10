import { TaskRunner } from "../helpers/TaskRunner";

export class TemplatesOverviewExportRunner extends TaskRunner<"TEMPLATES_OVERVIEW_EXPORT"> {
  async run() {
    return {
      temporary_file_id: 1,
    };
  }
}
