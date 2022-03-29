import { createCronWorker } from "./helpers/createCronWorker";

createCronWorker("petition-anonymizer", async (ctx, config) => {
  const [deletedPetitions, deletedReplies, deletedComments] = await Promise.all([
    ctx.petitions.getDeletedFrom("petition", config.anonymizeAfterDays),
    ctx.petitions.getDeletedFrom("petition_field_reply", config.anonymizeAfterDays),
    ctx.petitions.getDeletedFrom("petition_field_comment", config.anonymizeAfterDays),
  ]);

  for (const petition of deletedPetitions) {
    await ctx.petitions.anonymizePetition(petition.id);
  }
  await Promise.all([
    ctx.petitions.anonymizePetitionFieldReplies(deletedReplies),
    ctx.petitions.anonymizePetitionFieldComments(deletedComments),
  ]);
});
