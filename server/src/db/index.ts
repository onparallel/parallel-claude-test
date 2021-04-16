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
import { UserAuthenticationRepository } from "./repositories/UserAuthenticationRepository";
import { PetitionEventSubscriptionRepository } from "./repositories/PetitionEventSubscriptionRepository";
import { UserRepository } from "./repositories/UserRepository";
import { TagRepository } from "./repositories/TagRepository";

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
  bind<PetitionEventSubscriptionRepository>(
    PetitionEventSubscriptionRepository
  ).toSelf();
  bind<TagRepository>(TagRepository).toSelf();
});
