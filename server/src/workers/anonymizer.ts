import { uniq } from "remeda";
import { createCronWorker } from "./helpers/createCronWorker";

createCronWorker("anonymizer", async (ctx, config) => {
  const DAYS = config.anonymizeAfterDays;

  const petitions = await ctx.petitions.getDeletedPetitionsToAnonymize(DAYS);
  let count = 0;
  ctx.logger.debug(`Anonymizing ${petitions.length} deleted petitions`);
  for (const petition of petitions) {
    ctx.logger.debug(
      `Anonymizing deleted petition ${petition.id} (${++count}/${petitions.length})`
    );
    await ctx.petitions.anonymizePetition(petition.id);
  }

  const replies = await ctx.petitions.getDeletedPetitionFieldRepliesToAnonymize(DAYS);
  ctx.logger.debug(`Anonymizing ${replies.length} deleted replies`);
  if (replies.length > 0) {
    await ctx.petitions.anonymizePetitionFieldReplies(replies);
  }

  const comments = await ctx.petitions.getDeletedPetitionFieldCommentsToAnonymize(DAYS);
  ctx.logger.debug(`Anonymizing ${comments.length} deleted comments`);
  if (comments.length > 0) {
    await ctx.petitions.anonymizePetitionFieldComments(comments);
  }

  // anonymizes contacts deleted more than `anonymizeAfterDays` days ago
  ctx.logger.debug(`Anonymizing deleted contacts`);
  await ctx.contacts.anonymizeDeletedContacts(DAYS);

  // there can be multiple file_uploads with same path (e.g. when doing massive sends of a petition with submitted file replies)
  // so we need to make sure to only delete the entry in S3 if there are no other files referencing to that object
  const filesToDelete = await ctx.files.getFileUploadsToDelete();
  ctx.logger.debug(`Anonymizing ${filesToDelete.length} deleted files`);
  const filePaths = uniq(filesToDelete.map((f) => f.path));
  await ctx.aws.fileUploads.deleteFile(filePaths);
  await ctx.files.updateFileUpload(
    filesToDelete.map((f) => f.id),
    { file_deleted_at: new Date() },
    "Worker:Anonymizer"
  );

  // search for closed petitions that are configured to be anonymized after a certain time
  const organizations = await ctx.organizations.getOrganizationsWithFeatureFlag("AUTO_ANONYMIZE");
  for (const org of organizations) {
    ctx.logger.debug(`Anonymizing closed petitions of Organization:${org.id}: ${org.name}`);
    const closedPetitions = await ctx.petitions.getClosedPetitionsToAnonymize(org.id);
    count = 0;
    ctx.logger.debug(`Anonymizing ${closedPetitions.length} closed petitions`);
    for (const petition of closedPetitions) {
      ctx.logger.debug(
        `Anonymizing closed petition ${petition.id} (${++count}/${closedPetitions.length})`
      );
      await ctx.petitions.anonymizePetition(petition.id);
    }
  }
});
