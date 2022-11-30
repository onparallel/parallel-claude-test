import { PetitionRepository } from "../db/repositories/PetitionRepository";

/**
 * Look up in the possible "chain of delegated accesses" to get the access that was created by an User, as it is the one linked to the original PetitionMessage
 * This way the recipients of delegated accesses can see the original message subject on their emails.
 * */
// TODO: refactor petitionRepository param
export async function loadOriginalMessageByPetitionAccess(
  petitionAccessId: number,
  petitionId: number,
  petitionsRepository: PetitionRepository
) {
  const allAccesses = await petitionsRepository.loadAccessesForPetition(petitionId);
  let access = await petitionsRepository.loadAccess(petitionAccessId);

  let triesLeft = 10;
  while (access?.delegator_contact_id && triesLeft > 0) {
    access = allAccesses.find((a) => a.contact_id === access!.delegator_contact_id) ?? null;
    triesLeft--;
  }
  if (access) {
    const [firstMessage] = await petitionsRepository.loadMessagesByPetitionAccessId(access.id);
    return firstMessage;
  }
  return null;
}
