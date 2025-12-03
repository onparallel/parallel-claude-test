import { createReadStream } from "fs";
import { inject, injectable } from "inversify";
import { isNonNullish, isNullish } from "remeda";
import { CONFIG, Config } from "../../../config";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import { ILogger, LOGGER } from "../../../services/Logger";
import { IPetitionBinder, PETITION_BINDER } from "../../../services/PetitionBinder";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { sanitizeFilenameWithSuffix } from "../../../util/sanitizeFilenameWithSuffix";
import { withTempDir } from "../../../util/withTempDir";
import { TaskRunner } from "../../helpers/TaskRunner";

@injectable()
export class PrintPdfRunner extends TaskRunner<"PRINT_PDF"> {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(PETITION_BINDER) private petitionBinder: IPetitionBinder,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }

  async run(task: Task<"PRINT_PDF">) {
    const {
      petition_id: petitionId,
      skip_attachments: skipAttachments,
      include_netdocuments_links: includeNetDocumentsLinks,
    } = task.input;

    const hasAccess = isNonNullish(task.user_id)
      ? await this.petitions.userHasAccessToPetitions(task.user_id, [petitionId])
      : isNonNullish(task.petition_access_id)
        ? this.petitions.recipientHasAccessToPetition(task.petition_access_id, petitionId)
        : false;
    if (!hasAccess) {
      throw new Error(
        `${
          isNonNullish(task.user_id)
            ? `User:${task.user_id}`
            : `PetitionAccess:${task.petition_access_id}`
        } has no access to petition ${petitionId}`,
      );
    }
    const [petition, owner] = await Promise.all([
      this.petitions.loadPetition(petitionId),
      this.petitions.loadPetitionOwner(petitionId),
    ]);
    if (isNullish(petition) || petition.deletion_scheduled_at !== null) {
      throw new Error(`Petition:${petitionId} not found`);
    }
    if (isNullish(owner)) {
      throw new Error(`Owner of petition Petition:${petitionId} not found`);
    }

    const documentTitle = petition.signature_config?.isEnabled
      ? (petition.signature_config?.title ?? null)
      : null;

    await this.onProgress(task, 25);

    await using tempDir = await withTempDir();
    const tmpFilePath = await this.petitionBinder.createBinder(owner.id, {
      petitionId,
      documentTitle,
      includeAnnexedDocuments: !skipAttachments,
      includeNetDocumentsLinks,
      outputFilePath: tempDir.path,
    });

    await this.onProgress(task, 75);

    const tmpFile = await this.uploadTemporaryFile({
      stream: createReadStream(tmpFilePath),
      filename: sanitizeFilenameWithSuffix(documentTitle ?? "parallel", ".pdf"),
      contentType: "application/pdf",
    });

    return { temporary_file_id: tmpFile.id };
  }
}
