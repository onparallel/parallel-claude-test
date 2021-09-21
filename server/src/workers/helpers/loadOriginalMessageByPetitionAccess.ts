import { WorkerContext } from "../../context";

/**
 * Look up in the possible "chain of delegated accesses" to get the access that was created by an User, as it is the one linked to the original PetitionMessage
 * This way the recipients of delegated accesses can see the original message subject on their emails.
 * */
export async function loadOriginalMessageByPetitionAccess(
  petitionAccessId: number,
  petitionId: number,
  ctx: WorkerContext
) {
  const allAccesses = await ctx.petitions.loadAccessesForPetition(petitionId);
  let access = await ctx.petitions.loadAccess(petitionAccessId);

  let triesLeft = 10;
  while (access?.delegator_contact_id && triesLeft > 0) {
    access = allAccesses.find((a) => a.contact_id === access!.delegator_contact_id) ?? null;
    triesLeft--;
  }
  if (access) {
    const [firstMessage] = await ctx.petitions.loadMessagesByPetitionAccessId(access.id);
    return firstMessage;
  }
  return null;
}
