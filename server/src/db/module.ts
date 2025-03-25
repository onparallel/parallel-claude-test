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
import { createKnex, KNEX, KNEX_READ_ONLY } from "./knex";
import { ContactRepository, ReadOnlyContactRepository } from "./repositories/ContactRepository";
import { DashboardRepository } from "./repositories/DashboardRepository";
import { EmailLogRepository } from "./repositories/EmailLogRepository";
import { EventRepository } from "./repositories/EventRepository";
import { FeatureFlagRepository } from "./repositories/FeatureFlagRepository";
import { FileRepository, ReadOnlyFileRepository } from "./repositories/FileRepository";
import { IntegrationRepository } from "./repositories/IntegrationRepository";
import { LicenseCodeRepository } from "./repositories/LicenseCodeRepository";
import { OrganizationRepository } from "./repositories/OrganizationRepository";
import { PetitionApprovalRequestRepository } from "./repositories/PetitionApprovalRequestRepository";
import { PetitionCommentRepository } from "./repositories/PetitionCommentRepository";
import { PetitionRepository, ReadOnlyPetitionRepository } from "./repositories/PetitionRepository";
import { ProfileRepository } from "./repositories/ProfileRepository";
import { SubscriptionRepository } from "./repositories/SubscriptionRepository";
import { ReadOnlySystemRepository, SystemRepository } from "./repositories/SystemRepository";
import { ReadOnlyTagRepository, TagRepository } from "./repositories/TagRepository";
import { TaskRepository } from "./repositories/TaskRepository";
import { UserAuthenticationRepository } from "./repositories/UserAuthenticationRepository";
import { UserGroupRepository } from "./repositories/UserGroupRepository";
import { ReadOnlyUserRepository, UserRepository } from "./repositories/UserRepository";
import { ViewRepository } from "./repositories/ViewRepository";

export const dbModule = new ContainerModule((options) => {
  options.bind<Knex>(KNEX).toDynamicValue(createKnex("read-write")).inSingletonScope();
  options.bind<Knex>(KNEX_READ_ONLY).toDynamicValue(createKnex("read-only")).inSingletonScope();
  options.bind<ContactRepository>(ContactRepository).toSelf();
  options.bind<EmailLogRepository>(EmailLogRepository).toSelf();
  options.bind<FeatureFlagRepository>(FeatureFlagRepository).toSelf();
  options.bind<FileRepository>(FileRepository).toSelf();
  options.bind<IntegrationRepository>(IntegrationRepository).toSelf();
  options.bind<OrganizationRepository>(OrganizationRepository).toSelf();
  options.bind<PetitionRepository>(PetitionRepository).toSelf();
  options.bind<UserRepository>(UserRepository).toSelf();
  options.bind<UserAuthenticationRepository>(UserAuthenticationRepository).toSelf();
  options.bind<UserGroupRepository>(UserGroupRepository).toSelf();
  options.bind<TagRepository>(TagRepository).toSelf();
  options.bind<SystemRepository>(SystemRepository).toSelf();
  options.bind<SubscriptionRepository>(SubscriptionRepository).toSelf();
  options.bind<TaskRepository>(TaskRepository).toSelf();
  options.bind<LicenseCodeRepository>(LicenseCodeRepository).toSelf();
  options.bind<ViewRepository>(ViewRepository).toSelf();
  options.bind<ProfileRepository>(ProfileRepository).toSelf();
  options.bind<EventRepository>(EventRepository).toSelf();
  options.bind<DashboardRepository>(DashboardRepository).toSelf();
  options.bind<PetitionApprovalRequestRepository>(PetitionApprovalRequestRepository).toSelf();
  options.bind<PetitionCommentRepository>(PetitionCommentRepository).toSelf();

  options.bind<ReadOnlyPetitionRepository>(ReadOnlyPetitionRepository).toSelf();
  options.bind<ReadOnlyFileRepository>(ReadOnlyFileRepository).toSelf();
  options.bind<ReadOnlyContactRepository>(ReadOnlyContactRepository).toSelf();
  options.bind<ReadOnlyUserRepository>(ReadOnlyUserRepository).toSelf();
  options.bind<ReadOnlySystemRepository>(ReadOnlySystemRepository).toSelf();
  options.bind<ReadOnlyTagRepository>(ReadOnlyTagRepository).toSelf();

  // Repository helpers
  options
    .bind<ProfileValuesFilterRepositoryHelper>(PROFILE_VALUES_FILTER_REPOSITORY_HELPER)
    .to(ProfileValuesFilterRepositoryHelper);
  options
    .bind<PetitionFilterRepositoryHelper>(PETITION_FILTER_REPOSITORY_HELPER)
    .to(PetitionFilterRepositoryHelper);
});
