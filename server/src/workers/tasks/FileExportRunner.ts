import { TaskRunner } from "../helpers/TaskRunner";

export class FileExportRunner extends TaskRunner<"FILE_EXPORT"> {
  protected override async run({ signal }: { signal: AbortSignal }) {
    const { integration_id: integrationId, petition_id: petitionId, pattern } = this.task.input;

    if (!this.task.user_id) {
      throw new Error(`Task ${this.task.id} is missing user_id`);
    }

    const hasAccess = await this.ctx.petitions.userHasAccessToPetitions(this.task.user_id, [
      petitionId,
    ]);
    if (!hasAccess) {
      throw new Error(`User ${this.task.user_id} has no access to petition ${petitionId}`);
    }

    const log = await this.ctx.fileExport.createPetitionFilesExportLog(
      integrationId,
      petitionId,
      pattern,
      this.task.user_id,
      async (progress) => {
        this.ctx.logger.info(`[FileExportRunner:${this.task.id}]: ${Math.round(progress * 100)}%`);
        await this.onProgress(progress * 100 * 0.95);
      },
    );

    return {
      file_export_log_id: log.id,
      window_url: await this.ctx.fileExport.buildWindowUrl(integrationId, log.id),
    };
  }
}
