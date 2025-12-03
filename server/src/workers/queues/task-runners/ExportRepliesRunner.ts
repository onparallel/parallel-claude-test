import { inject, injectable } from "inversify";
import { CONFIG, Config } from "../../../config";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { ILogger, LOGGER } from "../../../services/Logger";
import {
  PETITION_FILES_SERVICE,
  PetitionFilesService,
} from "../../../services/PetitionFilesService";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { createZipFile } from "../../../util/createZipFile";
import { sanitizeFilenameWithSuffix } from "../../../util/sanitizeFilenameWithSuffix";
import { withTempDir } from "../../../util/withTempDir";
import { TaskRunner } from "../../helpers/TaskRunner";

@injectable()
export class ExportRepliesRunner extends TaskRunner<"EXPORT_REPLIES"> {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(PETITION_FILES_SERVICE) private petitionFiles: PetitionFilesService,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }

  async run(task: Task<"EXPORT_REPLIES">) {
    const { petition_id: petitionId, pattern } = task.input;

    if (!task.user_id) {
      throw new Error(`Task ${task.id} is missing user_id`);
    }
    const hasAccess = await this.petitions.userHasAccessToPetitions(task.user_id, [petitionId]);
    if (!hasAccess) {
      throw new Error(`User ${task.user_id} has no access to petition ${petitionId}`);
    }
    const petition = (await this.petitions.loadPetition(petitionId))!;
    const name = petition.name?.replace(/\./g, "_") ?? "files";

    const userData = await this.users.loadUserDataByUserId(task.user_id);

    await using tempDir = await withTempDir(`zip-`);
    const zipFile = createZipFile(
      tempDir.path,
      await this.petitionFiles.getPetitionFiles(petitionId, task.user_id, {
        pattern: pattern ?? undefined,
        locale: userData!.preferred_locale,
        include: [
          "PETITION_EXCEL_EXPORT",
          "PETITION_FILE_FIELD_REPLIES",
          "PETITION_LATEST_SIGNATURE",
        ],
        maxFileSizeBytes: 1024 * 1024 * 1024, // 1GB
      }),
      {
        onProgress: (processed, totalCount) => {
          this.onProgress(task, (processed / totalCount) * 100 * 0.95);
        },
      },
    );

    const tmpFile = await this.uploadTemporaryFile({
      stream: zipFile,
      filename: sanitizeFilenameWithSuffix(name, ".zip"),
      contentType: "application/zip",
    });

    return { temporary_file_id: tmpFile.id };
  }
}
