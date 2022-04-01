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
    ctx.contacts.anonymizeDeletedContacts(config.anonymizeAfterDays),
  ]);
});
