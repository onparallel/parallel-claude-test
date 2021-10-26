import { ContainerModule } from "inversify";
import { Knex } from "knex";
import { createKnex, KNEX } from "./knex";
import { ContactRepository } from "./repositories/ContactRepository";
import { EmailLogRepository } from "./repositories/EmailLogRepository";
import { FeatureFlagRepository } from "./repositories/FeatureFlagRepository";
import { FileRepository } from "./repositories/FileRepository";
import { IntegrationRepository } from "./repositories/IntegrationRepository";
import { OrganizationRepository } from "./repositories/OrganizationRepository";
import { PetitionRepository } from "./repositories/PetitionRepository";
import { ReportingRepository } from "./repositories/ReportingRepository";
import { SubscriptionRepository } from "./repositories/SubscriptionRepository";
import { SystemRepository } from "./repositories/SystemRepository";
import { TagRepository } from "./repositories/TagRepository";
import { TaskRepository } from "./repositories/TaskRepository";
import { UserAuthenticationRepository } from "./repositories/UserAuthenticationRepository";
import { UserGroupRepository } from "./repositories/UserGroupRepository";
import { UserRepository } from "./repositories/UserRepository";

export const dbModule = new ContainerModule((bind) => {
  bind<Knex>(KNEX).toDynamicValue(createKnex).inSingletonScope();

  // Repositories
  bind<ContactRepository>(ContactRepository).toSelf();
  bind<EmailLogRepository>(EmailLogRepository).toSelf();
  bind<FeatureFlagRepository>(FeatureFlagRepository).toSelf();
  bind<FileRepository>(FileRepository).toSelf();
  bind<IntegrationRepository>(IntegrationRepository).toSelf();
  bind<OrganizationRepository>(OrganizationRepository).toSelf();
  bind<PetitionRepository>(PetitionRepository).toSelf();
  bind<UserRepository>(UserRepository).toSelf();
  bind<ReportingRepository>(ReportingRepository).toSelf();
  bind<UserAuthenticationRepository>(UserAuthenticationRepository).toSelf();
  bind<UserGroupRepository>(UserGroupRepository).toSelf();
  bind<TagRepository>(TagRepository).toSelf();
  bind<SystemRepository>(SystemRepository).toSelf();
  bind<SubscriptionRepository>(SubscriptionRepository).toSelf();
  bind<TaskRepository>(TaskRepository).toSelf();
});
