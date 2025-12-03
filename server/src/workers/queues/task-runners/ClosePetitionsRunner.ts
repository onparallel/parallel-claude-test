import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../../../config";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { OrganizationRepository } from "../../../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { ILogger, LOGGER } from "../../../services/Logger";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { pMapChunk } from "../../../util/promises/pMapChunk";
import { TaskRunner } from "../../helpers/TaskRunner";

@injectable()
export class ClosePetitionsRunner extends TaskRunner<"CLOSE_PETITIONS"> {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }

  async run(task: Task<"CLOSE_PETITIONS">) {
    try {
      const { template_id: templateId } = task.input;

      if (!task.user_id) {
        throw new Error(`Task ${task.id} is missing user_id`);
      }

      // only for superadmins, for now
      const permissions = await this.users.loadUserPermissions(task.user_id);
      if (!permissions.find((p) => p === "SUPERADMIN")) {
        throw new Error(`User ${task.user_id} is not a SUPERADMIN`);
      }
      const user = await this.users.loadUser(task.user_id);
      if (!user) {
        throw new Error(`User ${task.user_id} not found`);
      }
      const organization = await this.organizations.loadOrg(user.org_id);
      if (!organization || organization.status !== "ROOT") {
        throw new Error("User's organization is not ROOT");
      }

      this.logger.info(`Closing petitions for template ${templateId}...`);
      const petitionIds = await this.petitions.getPetitionIdsFromTemplateReadyToClose(templateId);

      const totalCount = await petitionIds.length;
      this.logger.info(`Found ${totalCount} petitions...`);

      let closedCount = 0;
      const CHUNK_SIZE = 100;
      await pMapChunk(
        petitionIds,
        async (idsChunk) => {
          this.logger.info(
            `Closing petitions ${closedCount + 1}-${Math.min(closedCount + CHUNK_SIZE, totalCount)}...`,
          );
          await this.closePetitions(idsChunk, task.user_id!);
          closedCount += idsChunk.length;
        },
        { chunkSize: CHUNK_SIZE, concurrency: 1 },
      );

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        success: false,
        error,
      };
    }
  }

  private async closePetitions(ids: number[], userId: number) {
    if (ids.length === 0) {
      return;
    }
    await this.petitions.closePetitions(ids, `User:${userId}`);
    await this.petitions.updateRemindersForPetitions(ids, null);
    await this.petitions.createEvent(
      ids.map((id) => ({
        petition_id: id,
        type: "PETITION_CLOSED",
        data: {
          user_id: userId,
        },
      })),
    );
  }
}
