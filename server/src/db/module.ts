import { ContainerModule } from "inversify";
import { Knex } from "knex";
import {
  PETITION_FILTER_REPOSITORY_HELPER,
  PetitionFilterRepositoryHelper,
} from "./helpers/PetitionFilterRepositoryHelper";
import {
  PROFILE_VALUES_FILTER_REPOSITORY_HELPER,
  ProfileValuesFilterRepositoryHelper,
} from "./helpers/ProfileValuesFilterRepositoryHelper";
import { createKnex, KNEX } from "./knex";
import { ContactRepository } from "./repositories/ContactRepository";
import { DashboardRepository } from "./repositories/DashboardRepository";
import { EmailLogRepository } from "./repositories/EmailLogRepository";
import { EventRepository } from "./repositories/EventRepository";
import { FeatureFlagRepository } from "./repositories/FeatureFlagRepository";
import { FileRepository } from "./repositories/FileRepository";
import { IntegrationRepository } from "./repositories/IntegrationRepository";
import { LicenseCodeRepository } from "./repositories/LicenseCodeRepository";
import { OrganizationRepository } from "./repositories/OrganizationRepository";
import { PetitionApprovalRequestRepository } from "./repositories/PetitionApprovalRequestRepository";
import { PetitionCommentRepository } from "./repositories/PetitionCommentRepository";
import { PetitionRepository } from "./repositories/PetitionRepository";
import { ProfileRepository } from "./repositories/ProfileRepository";
import { SubscriptionRepository } from "./repositories/SubscriptionRepository";
import { SystemRepository } from "./repositories/SystemRepository";
import { TagRepository } from "./repositories/TagRepository";
import { TaskRepository } from "./repositories/TaskRepository";
import { UserAuthenticationRepository } from "./repositories/UserAuthenticationRepository";
import { UserGroupRepository } from "./repositories/UserGroupRepository";
import { UserRepository } from "./repositories/UserRepository";
import { ViewRepository } from "./repositories/ViewRepository";

export const dbModule = new ContainerModule((bind) => {
  bind<Knex>(KNEX)
    .toDynamicValue(createKnex("read-write"))
    .inSingletonScope()
    .whenNoAncestorTagged("db", "read-only");
  bind<Knex>(KNEX)
    .toDynamicValue(createKnex("read-only"))
    .inSingletonScope()
    .whenAnyAncestorTagged("db", "read-only");

  // Repositories
  bind<ContactRepository>(ContactRepository).toSelf();
  bind<EmailLogRepository>(EmailLogRepository).toSelf();
  bind<FeatureFlagRepository>(FeatureFlagRepository).toSelf();
  bind<FileRepository>(FileRepository).toSelf();
  bind<IntegrationRepository>(IntegrationRepository).toSelf();
  bind<OrganizationRepository>(OrganizationRepository).toSelf();
  bind<PetitionRepository>(PetitionRepository).toSelf();
  bind<UserRepository>(UserRepository).toSelf();
  bind<UserAuthenticationRepository>(UserAuthenticationRepository).toSelf();
  bind<UserGroupRepository>(UserGroupRepository).toSelf();
  bind<TagRepository>(TagRepository).toSelf();
  bind<SystemRepository>(SystemRepository).toSelf();
  bind<SubscriptionRepository>(SubscriptionRepository).toSelf();
  bind<TaskRepository>(TaskRepository).toSelf();
  bind<LicenseCodeRepository>(LicenseCodeRepository).toSelf();
  bind<ViewRepository>(ViewRepository).toSelf();
  bind<ProfileRepository>(ProfileRepository).toSelf();
  bind<EventRepository>(EventRepository).toSelf();
  bind<DashboardRepository>(DashboardRepository).toSelf();
  bind<PetitionApprovalRequestRepository>(PetitionApprovalRequestRepository).toSelf();
  bind<PetitionCommentRepository>(PetitionCommentRepository).toSelf();

  // Repository helpers
  bind<ProfileValuesFilterRepositoryHelper>(PROFILE_VALUES_FILTER_REPOSITORY_HELPER).to(
    ProfileValuesFilterRepositoryHelper,
  );
  bind<PetitionFilterRepositoryHelper>(PETITION_FILTER_REPOSITORY_HELPER).to(
    PetitionFilterRepositoryHelper,
  );
});
