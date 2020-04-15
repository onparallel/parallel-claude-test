import { ContainerModule } from "inversify";
import Knex from "knex";
import { createKnex, KNEX } from "./knex";
import { ContactReposistory } from "./repositories/ContactRepository";
import { EmailLogRepository } from "./repositories/EmailLogRepository";
import { FileUploadRepository } from "./repositories/FileUploadRepository";
import { OrganizationRepository } from "./repositories/OrganizationRepository";
import { PetitionRepository } from "./repositories/PetitionRepository";
import { ReminderRepository } from "./repositories/ReminderRepository";
import { UserReposistory } from "./repositories/UserRepository";

export const dbModule = new ContainerModule((bind) => {
  bind<Knex>(KNEX).toDynamicValue(createKnex).inSingletonScope();

  // Repositories
  bind<ContactReposistory>(ContactReposistory).toSelf();
  bind<EmailLogRepository>(EmailLogRepository).toSelf();
  bind<FileUploadRepository>(FileUploadRepository).toSelf();
  bind<OrganizationRepository>(OrganizationRepository).toSelf();
  bind<PetitionRepository>(PetitionRepository).toSelf();
  bind<ReminderRepository>(ReminderRepository).toSelf();
  bind<UserReposistory>(UserReposistory).toSelf();
});
