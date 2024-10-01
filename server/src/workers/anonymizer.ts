import { isNonNullish, unique } from "remeda";
import { Config } from "../config";
import { WorkerContext } from "../context";
import { createCronWorker } from "./helpers/createCronWorker";

createCronWorker("anonymizer", async (ctx, config) => {
  const DAYS = config.anonymizeAfterDays;

  const petitionIds = await ctx.petitions.getDeletedPetitionIdsToAnonymize(DAYS);
  let count = 0;
  ctx.logger.debug(`Anonymizing ${petitionIds.length} deleted petitions`);
  for (const petitionId of petitionIds) {
    ctx.logger.debug(
      `Anonymizing deleted petition ${petitionId} (${++count}/${petitionIds.length})`,
    );
    await ctx.petitions.anonymizePetition(petitionId);
  }

  const replies = await ctx.petitions.getDeletedPetitionFieldRepliesToAnonymize(DAYS);
  ctx.logger.debug(`Anonymizing ${replies.length} deleted replies`);
  if (replies.length > 0) {
    await ctx.petitions.anonymizePetitionFieldReplies(replies);
  }

  const commentIds = await ctx.petitions.getDeletedPetitionFieldCommentIdsToAnonymize(DAYS);
  ctx.logger.debug(`Anonymizing ${commentIds.length} deleted comments`);
  if (commentIds.length > 0) {
    await ctx.petitions.anonymizePetitionFieldComments(commentIds);
  }

  // anonymizes contacts deleted more than `anonymizeAfterDays` days ago
  ctx.logger.debug(`Anonymizing deleted contacts`);
  await ctx.contacts.anonymizeDeletedContacts(DAYS);

  // there can be multiple file_uploads with same path (e.g. when doing massive sends of a petition with submitted file replies)
  // so we need to make sure to only delete the entry in S3 if there are no other files referencing to that object
  const filesToDelete = await ctx.files.getFileUploadsToDelete(DAYS);
  ctx.logger.debug(`Anonymizing ${filesToDelete.length} deleted files`);
  const filePaths = unique(filesToDelete.map((f) => f.path));
  await ctx.storage.fileUploads.deleteFile(filePaths);
  await ctx.files.updateFileUpload(
    filesToDelete.map((f) => f.id),
    { file_deleted_at: new Date() },
    "AnonymizerWorker",
  );

  // search for closed parallels that are configured to be anonymized after a certain time
  const organizations = await ctx.organizations.getOrganizationsWithFeatureFlag("AUTO_ANONYMIZE");
  for (const org of organizations) {
    ctx.logger.debug(`Anonymizing closed parallels of Organization:${org.id}: ${org.name}`);
    const closedPetitions = await ctx.petitions.getClosedPetitionsToAnonymize(org.id);
    count = 0;
    ctx.logger.debug(`Anonymizing ${closedPetitions.length} closed parallels`);
    for (const petition of closedPetitions) {
      ctx.logger.debug(
        `Anonymizing closed petition ${petition.id} (${++count}/${closedPetitions.length})`,
      );
      await ctx.petitions.anonymizePetition(petition.id);
    }
  }

  // delete information of tasks created more than `anonymizeAfterDays` days ago
  ctx.logger.debug(`Anonymizing old tasks`);
  await ctx.tasks.anonymizeOldTasks(DAYS);

  await profilesAnonymizer(ctx, config);
});

async function profilesAnonymizer(ctx: WorkerContext, config: Config["cronWorkers"]["anonymizer"]) {
  // profile field files and values are deleted after 30 days of being removed
  await deleteRemovedProfileFilesAndValues(ctx, config);

  // delete profiles in DELETION_SCHEDULED status for more than 90 days
  await deleteProfilesScheduledForDeletion(ctx, config);

  // anonymize profiles deleted more than 30 days ago
  await anonymizeDeletedProfiles(ctx, config);
}

async function deleteRemovedProfileFilesAndValues(
  ctx: WorkerContext,
  config: Config["cronWorkers"]["anonymizer"],
) {
  const filesCount = await ctx.profiles.deleteRemovedProfileFieldFiles(
    config.anonymizeAfterDays,
    "AnonymizerWorker",
  );
  ctx.logger.debug(`Deleted ${filesCount} profile field files`);

  const valuesCount = await ctx.profiles.deleteRemovedProfileFieldValues(
    config.anonymizeAfterDays,
    "AnonymizerWorker",
  );
  ctx.logger.debug(`Deleted ${valuesCount} profile field values`);
}

async function deleteProfilesScheduledForDeletion(
  ctx: WorkerContext,
  config: Config["cronWorkers"]["anonymizer"],
) {
  const profileIds = await ctx.profiles.getProfileIdsReadyForDeletion(
    config.deleteScheduledProfilesAfterDays,
  );

  if (profileIds.length > 0) {
    ctx.logger.debug(`Deleting ${profileIds.length} profiles in DELETION_SCHEDULED state`);
    await ctx.profiles.deleteProfile(profileIds, "AnonymizerWorker");
    const removedRelationships = await ctx.profiles.deleteProfileRelationshipsByProfileId(
      profileIds,
      "AnonymizerWorker",
    );

    if (removedRelationships.length > 0) {
      const relationshipTypes = await ctx.profiles.loadProfileRelationshipType(
        removedRelationships.map((r) => r.profile_relationship_type_id),
      );

      // create events only on profiles that were not deleted
      const eventsData = removedRelationships
        .flatMap((r) => [
          profileIds.includes(r.left_side_profile_id)
            ? null
            : {
                profileId: r.left_side_profile_id,
                profileRelationshipId: r.id,
                profileRelationshipTypeId: r.profile_relationship_type_id,
                orgId: r.org_id,
              },
          profileIds.includes(r.right_side_profile_id)
            ? null
            : {
                profileId: r.right_side_profile_id,
                profileRelationshipId: r.id,
                profileRelationshipTypeId: r.profile_relationship_type_id,
                orgId: r.org_id,
              },
        ])
        .filter(isNonNullish);

      await ctx.profiles.createEvent(
        eventsData.map((d) => ({
          type: "PROFILE_RELATIONSHIP_REMOVED",
          org_id: d.orgId,
          profile_id: d.profileId,
          data: {
            user_id: null,
            profile_relationship_id: d.profileRelationshipId,
            reason: "PROFILE_DELETED",
            profile_relationship_type_alias: relationshipTypes.find(
              (rt) => rt!.id === d.profileRelationshipTypeId,
            )!.alias,
          },
        })),
      );
    }
  }
}

async function anonymizeDeletedProfiles(
  ctx: WorkerContext,
  config: Config["cronWorkers"]["anonymizer"],
) {
  const fileIdsToDelete: number[] = [];

  const profileIds = await ctx.profiles.getDeletedProfilesToAnonymize(config.anonymizeAfterDays);
  if (profileIds.length > 0) {
    ctx.logger.debug(`Anonymizing ${profileIds.length} deleted profiles`);
    fileIdsToDelete.push(...(await ctx.profiles.anonymizeProfile(profileIds)));
  }

  const fieldValues = await ctx.profiles.getDeletedProfileFieldValuesToAnonymize(
    config.anonymizeAfterDays,
  );
  if (fieldValues.length > 0) {
    ctx.logger.debug(`Anonymizing ${fieldValues.length} deleted profile field values`);
    await ctx.profiles.anonymizeProfileFieldValues(fieldValues);
  }

  const fieldFiles = await ctx.profiles.getDeletedProfileFieldFilesToAnonymize(
    config.anonymizeAfterDays,
  );
  if (fieldFiles.length > 0) {
    ctx.logger.debug(`Anonymizing ${fieldFiles.length} deleted profile field files`);
    fileIdsToDelete.push(...(await ctx.profiles.anonymizeProfileFieldFiles(fieldFiles)));
  }

  if (fileIdsToDelete.length > 0) {
    await ctx.files.deleteFileUpload(unique(fileIdsToDelete), "AnonymizerWorker");
  }
}
