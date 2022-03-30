import { createCronWorker } from "./helpers/createCronWorker";

createCronWorker("anonymizer", async (ctx, config) => {
  const [deletedPetitions, deletedReplies, deletedComments, deletedContacts] = await Promise.all([
    ctx.petitions.getRowsToAnonymizeFrom("petition", config.anonymizeAfterDays),
    ctx.petitions.getRowsToAnonymizeFrom("petition_field_reply", config.anonymizeAfterDays),
    ctx.petitions.getRowsToAnonymizeFrom("petition_field_comment", config.anonymizeAfterDays),
    ctx.contacts.getRowsToAnonymizeFrom("contact", config.anonymizeAfterDays),
  ]);

  for (const petition of deletedPetitions) {
    await ctx.petitions.anonymizePetition(petition.id);
  }
  await Promise.all([
    deletedReplies.length ? ctx.petitions.anonymizePetitionFieldReplies(deletedReplies) : null,
    deletedComments.length ? ctx.petitions.anonymizePetitionFieldComments(deletedComments) : null,
    deletedContacts.length ? ctx.contacts.anonymizeContacts(deletedContacts) : null,
  ]);
});
