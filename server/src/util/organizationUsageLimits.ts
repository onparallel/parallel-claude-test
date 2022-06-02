import { ApiContext } from "../context";

export async function getRequiredPetitionSendCredits(
  petitionId: number,
  groups: number, // how many groups we want to send to
  ctx: ApiContext
) {
  const [petition, currentAccesses] = await Promise.all([
    ctx.petitions.loadPetition(petitionId),
    ctx.petitions.loadAccessesForPetition(petitionId),
  ]);

  // bulk sends only if the petition has not been sent to anyone
  // we don't support this case for now, throw error to avoid possible future bugs
  if (currentAccesses.length > 0 && groups !== 1) {
    throw new Error("UNSUPPORTED_USE_CASE");
  }

  return Math.max(0, groups - petition!.credits_used);
}
