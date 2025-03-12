import sanitizeFilename from "sanitize-filename";
import { assert } from "ts-essentials";
import { FileExportLog } from "../../db/__types";
import { FileExport } from "../../integrations/file-export/FileExportIntegration";
import { never } from "../../util/never";
import { random } from "../../util/token";
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

    const log = await this.createPetitionFilesExportLog(
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
      window_url: await this.buildWindowUrl(integrationId, log.id),
    };
  }

  private async createPetitionFilesExportLog(
    integrationId: number,
    petitionId: number,
    filenamePattern: string | null,
    userId: number,
    onProgress?: (progress: number) => Promise<void>,
  ): Promise<FileExportLog> {
    const userData = await this.ctx.users.loadUserDataByUserId(userId);
    assert(userData, `User ${userId} not found`);
    const files = this.ctx.petitionFiles.getPetitionFiles<FileExport>(
      petitionId,
      userId,
      async (storage, path, filename, metadata) => ({
        id: random(16),
        status: "WAITING",
        metadata,
        filename: sanitizeFilename(filename),
        temporary_url: await storage.getSignedDownloadEndpoint(path, filename, "inline"),
      }),
      {
        include: ["excel-file", "petition-field-files", "latest-signature"],
        locale: userData.preferred_locale,
        pattern: filenamePattern,
        onProgress,
      },
    );

    let next: IteratorResult<FileExport>;
    const exportedFiles: FileExport[] = [];
    while (!(next = await files.next()).done) {
      exportedFiles.push(next.value);
    }

    if (exportedFiles.length === 0) {
      throw new Error(`No files to export on Petition:${petitionId}`);
    }

    return await this.ctx.integrations.createFileExportLog(
      {
        integration_id: integrationId,
        created_by_user_id: userId,
        json_export: exportedFiles,
      },
      `User:${userId}`,
    );
  }

  private async buildWindowUrl(integrationId: number, fileExportLogId: number) {
    const integration = await this.ctx.integrations.loadIntegration(integrationId);
    assert(integration?.type === "FILE_EXPORT", "Invalid integration");

    const client =
      integration.provider === "IMANAGE"
        ? this.ctx.iManageExport
        : never(`Provider ${integration.provider} not supported`);

    return await client.buildWindowUrl(integrationId, fileExportLogId);
  }
}
