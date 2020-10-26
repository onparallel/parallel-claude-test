import { ContainerModule } from "inversify";
import Knex from "knex";
import { createKnex, KNEX } from "./knex";
import { ContactRepository } from "./repositories/ContactRepository";
import { EmailLogRepository } from "./repositories/EmailLogRepository";
import { FeatureFlagRepository } from "./repositories/FeatureFlagRepository";
import { FileUploadRepository } from "./repositories/FileUploadRepository";
import { OrganizationRepository } from "./repositories/OrganizationRepository";
import { PetitionRepository } from "./repositories/PetitionRepository";
import { ReportingRepository } from "./repositories/ReportingRepository";
import { UserRepository } from "./repositories/UserRepository";

export const dbModule = new ContainerModule((bind) => {
  bind<Knex>(KNEX).toDynamicValue(createKnex).inSingletonScope();

  // Repositories
  bind<ContactRepository>(ContactRepository).toSelf();
  bind<EmailLogRepository>(EmailLogRepository).toSelf();
  bind<FeatureFlagRepository>(FeatureFlagRepository).toSelf();
  bind<FileUploadRepository>(FileUploadRepository).toSelf();
  bind<OrganizationRepository>(OrganizationRepository).toSelf();
  bind<PetitionRepository>(PetitionRepository).toSelf();
  bind<UserRepository>(UserRepository).toSelf();
  bind<ReportingRepository>(ReportingRepository).toSelf();
});
