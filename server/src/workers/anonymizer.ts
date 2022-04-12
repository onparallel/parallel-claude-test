import { uniq } from "remeda";
import { createCronWorker } from "./helpers/createCronWorker";

createCronWorker("anonymizer", async (ctx, config) => {
  const [petitions, replies, comments] = await Promise.all([
    ctx.petitions.getPetitionsToAnonymize(config.anonymizeAfterDays),
    ctx.petitions.getPetitionFieldRepliesToAnonymize(config.anonymizeAfterDays),
    ctx.petitions.getPetitionFieldCommentsToAnonymize(config.anonymizeAfterDays),
  ]);

  for (const petition of petitions) {
    await ctx.petitions.anonymizePetition(petition.id);
  }
  await Promise.all([
    replies.length ? ctx.petitions.anonymizePetitionFieldReplies(replies) : null,
    comments.length ? ctx.petitions.anonymizePetitionFieldComments(comments) : null,
  ]);

  // anonymizes contacts deleted more than `anonymizeAfterDays` days ago
  await ctx.contacts.anonymizeDeletedContacts(config.anonymizeAfterDays);

  // there can be multiple file_uploads with same path (e.g. when doing massive sends of a petition with submitted file replies)
  // so we need to make sure to only delete the entry in S3 if there are no other files referencing to that object
  const filesToDelete = await ctx.files.getFileUploadsToDelete();
  const filePaths = uniq(filesToDelete.map((f) => f.path));
  await ctx.aws.fileUploads.deleteFile(filePaths);
  await ctx.files.updateFileUpload(
    filesToDelete.map((f) => f.id),
    { file_deleted_at: new Date() },
    "Worker:Anonymizer"
  );
});
