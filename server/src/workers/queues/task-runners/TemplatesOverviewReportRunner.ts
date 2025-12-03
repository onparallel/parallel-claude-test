import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../../../config";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { ReadOnlyPetitionRepository } from "../../../db/repositories/PetitionRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { ILogger, LOGGER } from "../../../services/Logger";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { TaskRunner } from "../../helpers/TaskRunner";

@injectable()
export class TemplatesOverviewReportRunner extends TaskRunner<"TEMPLATES_OVERVIEW_REPORT"> {
  constructor(
    @inject(UserRepository) private users: UserRepository,
    @inject(ReadOnlyPetitionRepository) private readonlyPetitions: ReadOnlyPetitionRepository,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }
  async run(task: Task<"TEMPLATES_OVERVIEW_REPORT">) {
    if (!task.user_id) {
      throw new Error(`Task ${task.id} is missing user_id`);
    }
    const user = (await this.users.loadUser(task.user_id))!;
    const { start_date: startDate, end_date: endDate } = task.input;
    return await this.readonlyPetitions.getPetitionStatsOverview(
      user.org_id,
      user.id,
      startDate,
      endDate,
    );
  }
}
