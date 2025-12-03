import { inject, injectable } from "inversify";
import { isNonNullish, unique } from "remeda";
import { Config } from "../config";
import { ContactRepository } from "../db/repositories/ContactRepository";
import { FileRepository } from "../db/repositories/FileRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { TaskRepository } from "../db/repositories/TaskRepository";
import { ILogger, LOGGER } from "../services/Logger";
import { IStorageService, STORAGE_SERVICE } from "../services/StorageService";
import { createCronWorker, CronWorker } from "./helpers/createCronWorker";

@injectable()
export class AnonymizerCronWorker extends CronWorker<"anonymizer"> {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(ContactRepository) private contacts: ContactRepository,
    @inject(FileRepository) private files: FileRepository,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(TaskRepository) private tasks: TaskRepository,
    @inject(LOGGER) private logger: ILogger,
    @inject(STORAGE_SERVICE) private storage: IStorageService,
  ) {
    super();
  }

  async handler(config: Config["cronWorkers"]["anonymizer"]) {
    const DAYS = config.anonymizeAfterDays;

    const petitionIds = await this.petitions.getDeletedPetitionIdsToAnonymize(DAYS);
    let count = 0;
    this.logger.debug(`Anonymizing ${petitionIds.length} deleted petitions`);
    for (const petitionId of petitionIds) {
      this.logger.debug(
        `Anonymizing deleted petition ${petitionId} (${++count}/${petitionIds.length})`,
      );
      await this.petitions.anonymizePetition(petitionId);
    }

    const replies = await this.petitions.getDeletedPetitionFieldRepliesToAnonymize(DAYS);
    this.logger.debug(`Anonymizing ${replies.length} deleted replies`);
    if (replies.length > 0) {
      await this.petitions.anonymizePetitionFieldReplies(replies);
    }

    const commentIds = await this.petitions.getDeletedPetitionFieldCommentIdsToAnonymize(DAYS);
    this.logger.debug(`Anonymizing ${commentIds.length} deleted comments`);
    if (commentIds.length > 0) {
      await this.petitions.anonymizePetitionComments(commentIds);
    }

    // anonymizes contacts deleted more than `anonymizeAfterDays` days ago
    this.logger.debug(`Anonymizing deleted contacts`);
    await this.contacts.anonymizeDeletedContacts(DAYS);

    // there can be multiple file_uploads with same path (e.g. when doing massive sends of a petition with submitted file replies)
    // so we need to make sure to only delete the entry in S3 if there are no other files referencing to that object
    const filesToDelete = await this.files.getFileUploadsToDelete(DAYS);
    this.logger.debug(`Anonymizing ${filesToDelete.length} deleted files`);
    const filePaths = unique(filesToDelete.map((f) => f.path));
    await this.storage.fileUploads.deleteFile(filePaths);
    await this.files.updateFileUpload(
      filesToDelete.map((f) => f.id),
      { file_deleted_at: new Date() },
      "AnonymizerWorker",
    );

    // search for closed parallels that are configured to be anonymized after a certain time
    const organizations =
      await this.organizations.getOrganizationsWithFeatureFlag("AUTO_ANONYMIZE");
    for (const org of organizations) {
      this.logger.debug(`Anonymizing closed parallels of Organization:${org.id}: ${org.name}`);
      const closedPetitions = await this.petitions.getClosedPetitionsToAnonymize(org.id);
      count = 0;
      this.logger.debug(`Anonymizing ${closedPetitions.length} closed parallels`);
      for (const petition of closedPetitions) {
        this.logger.debug(
          `Anonymizing closed petition ${petition.id} (${++count}/${closedPetitions.length})`,
        );
        await this.petitions.anonymizePetition(petition.id);
      }
    }

    // delete information of tasks created more than `anonymizeAfterDays` days ago
    this.logger.debug(`Anonymizing old tasks`);
    await this.tasks.anonymizeOldTasks(DAYS);

    await this.petitions.deletePetitionsScheduledForDeletion(
      config.deleteScheduledPetitionsAfterDays,
      "AnonymizerWorker",
    );

    await this.profilesAnonymizer(config);
  }

  private async profilesAnonymizer(config: Config["cronWorkers"]["anonymizer"]) {
    // profile field files and values are deleted after 30 days of being removed
    await this.deleteRemovedProfileFilesAndValues(config);

    // delete profiles in DELETION_SCHEDULED status for more than 90 days
    await this.deleteProfilesScheduledForDeletion(config);

    // anonymize profiles deleted more than 30 days ago
    await this.anonymizeDeletedProfiles(config);
  }

  private async deleteRemovedProfileFilesAndValues(config: Config["cronWorkers"]["anonymizer"]) {
    const filesCount = await this.profiles.deleteRemovedProfileFieldFiles(
      config.anonymizeAfterDays,
      "AnonymizerWorker",
    );
    this.logger.debug(`Deleted ${filesCount} profile field files`);

    const valuesCount = await this.profiles.deleteRemovedProfileFieldValues(
      config.anonymizeAfterDays,
      "AnonymizerWorker",
    );
    this.logger.debug(`Deleted ${valuesCount} profile field values`);
  }

  private async deleteProfilesScheduledForDeletion(config: Config["cronWorkers"]["anonymizer"]) {
    const profileIds = await this.profiles.getProfileIdsReadyForDeletion(
      config.deleteScheduledProfilesAfterDays,
    );

    if (profileIds.length > 0) {
      this.logger.debug(`Deleting ${profileIds.length} profiles in DELETION_SCHEDULED state`);
      await this.profiles.deleteProfile(profileIds, "AnonymizerWorker");
      const removedRelationships = await this.profiles.deleteProfileRelationshipsByProfileId(
        profileIds,
        "AnonymizerWorker",
      );

      if (removedRelationships.length > 0) {
        const relationshipTypes = await this.profiles.loadProfileRelationshipType(
          removedRelationships.map((r) => r.profile_relationship_type_id),
        );

        // create events only on profiles that were not deleted
        const eventsData = removedRelationships
          .flatMap((r) => [
            profileIds.includes(r.left_side_profile_id)
              ? null
              : {
                  profileId: r.left_side_profile_id,
                  deletedProfileId: r.right_side_profile_id,
                  profileRelationshipId: r.id,
                  profileRelationshipTypeId: r.profile_relationship_type_id,
                  orgId: r.org_id,
                },
            profileIds.includes(r.right_side_profile_id)
              ? null
              : {
                  profileId: r.right_side_profile_id,
                  deletedProfileId: r.left_side_profile_id,
                  profileRelationshipId: r.id,
                  profileRelationshipTypeId: r.profile_relationship_type_id,
                  orgId: r.org_id,
                },
          ])
          .filter(isNonNullish);

        await this.profiles.createEvent(
          eventsData.map((d) => {
            const relationshipType = relationshipTypes.find(
              (rt) => rt!.id === d.profileRelationshipTypeId,
            );
            return {
              type: "PROFILE_RELATIONSHIP_REMOVED",
              org_id: d.orgId,
              profile_id: d.profileId,
              data: {
                user_id: null,
                profile_relationship_id: d.profileRelationshipId,
                reason: "PROFILE_DELETED",
                profile_relationship_type_alias: relationshipType?.alias ?? null,
                profile_relationship_type_id: d.profileRelationshipTypeId,
                other_side_profile_id: d.deletedProfileId,
                org_integration_id: null,
              },
            };
          }),
        );
      }
    }
  }

  private async anonymizeDeletedProfiles(config: Config["cronWorkers"]["anonymizer"]) {
    const fileIdsToDelete: number[] = [];

    const profileIds = await this.profiles.getDeletedProfilesToAnonymize(config.anonymizeAfterDays);
    if (profileIds.length > 0) {
      this.logger.debug(`Anonymizing ${profileIds.length} deleted profiles`);
      fileIdsToDelete.push(...(await this.profiles.anonymizeProfile(profileIds)));
    }

    const fieldValues = await this.profiles.getDeletedProfileFieldValuesToAnonymize(
      config.anonymizeAfterDays,
    );
    if (fieldValues.length > 0) {
      this.logger.debug(`Anonymizing ${fieldValues.length} deleted profile field values`);
      await this.profiles.anonymizeProfileFieldValues(fieldValues);
    }

    const fieldFiles = await this.profiles.getDeletedProfileFieldFilesToAnonymize(
      config.anonymizeAfterDays,
    );
    if (fieldFiles.length > 0) {
      this.logger.debug(`Anonymizing ${fieldFiles.length} deleted profile field files`);
      fileIdsToDelete.push(...(await this.profiles.anonymizeProfileFieldFiles(fieldFiles)));
    }

    if (fileIdsToDelete.length > 0) {
      await this.files.deleteFileUpload(unique(fileIdsToDelete), "AnonymizerWorker");
    }
  }
}

createCronWorker("anonymizer", AnonymizerCronWorker);
