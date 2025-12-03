import { inject, injectable } from "inversify";
import sanitizeFilename from "sanitize-filename";
import { Readable } from "stream";
import { Config, CONFIG } from "../../../config";
import { FeatureFlagRepository } from "../../../db/repositories/FeatureFlagRepository";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { IntegrationRepository } from "../../../db/repositories/IntegrationRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { DOW_JONES_CLIENT, DowJonesClient } from "../../../integrations/dow-jones/DowJonesClient";
import { ILogger, LOGGER } from "../../../services/Logger";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { TaskRunner } from "../../helpers/TaskRunner";

@injectable()
export class DowJonesProfileDownloadRunner extends TaskRunner<"DOW_JONES_PROFILE_DOWNLOAD"> {
  constructor(
    @inject(UserRepository) private users: UserRepository,
    @inject(FeatureFlagRepository) private featureFlags: FeatureFlagRepository,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(DOW_JONES_CLIENT) private dowJonesKyc: DowJonesClient,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }

  async run(task: Task<"DOW_JONES_PROFILE_DOWNLOAD">) {
    if (!task.user_id) {
      throw new Error(`Task ${task.id} is missing user_id`);
    }

    const user = (await this.users.loadUser(task.user_id))!;

    const hasFeatureFlag = await this.featureFlags.userHasFeatureFlag(task.user_id, [
      "DOW_JONES_KYC",
    ]);

    const [dowJonesIntegration] = await this.integrations.loadIntegrationsByOrgId(
      user.org_id,
      "DOW_JONES_KYC",
    );

    if (!hasFeatureFlag) {
      throw new Error(`User ${task.user_id} has no access to DOW JONES feature`);
    }
    if (!dowJonesIntegration) {
      throw new Error(`DOW JONES integration not found for user ${task.user_id}`);
    }

    const response = await this.dowJonesKyc.riskEntityProfilePdf(
      dowJonesIntegration.id,
      task.input.profile_id,
    );

    const tmpFile = await this.uploadTemporaryFile({
      stream: Readable.from(Buffer.from(response.binary_stream, "base64")),
      filename: sanitizeFilename(`${task.input.profile_id}.pdf`),
      contentType: response.mime_type,
    });

    return { temporary_file_id: tmpFile.id };
  }
}
