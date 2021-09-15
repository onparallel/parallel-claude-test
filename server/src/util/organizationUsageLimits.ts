import { isDefined, uniq } from "remeda";
import { ApiContext } from "../context";
import { Contact, User } from "../db/__types";

export async function getRequiredPetitionSendCredits(
  petitionId: number,
  contactIdGroups: number[][],
  user: User,
  ctx: ApiContext
) {
  let requiredCredits = 0;

  const [currentAccesses, newContacts] = await Promise.all([
    ctx.petitions.loadAccessesForPetition(petitionId),
    ctx.contacts.loadContact(uniq(contactIdGroups.flat())),
  ]);

  const currentContacts = (
    await ctx.contacts.loadContact(uniq(currentAccesses.map((a) => a.contact_id)))
  ).filter(isDefined);

  if (currentContacts.length > 0 && contactIdGroups.length !== 1) {
    // we don't support this case for now, throw error to avoid possible future bugs
    throw new Error("UNSUPPORTED_USE_CASE");
  }

  /* 
    count required credits only if the petition:
      - has not been sent to anyone yet; or
      - has been sent only to the logged user email 
  */
  if (
    currentContacts.length === 0 ||
    (currentContacts.length === 1 && currentContacts[0].email === user.email)
  ) {
    for (const group of contactIdGroups) {
      const contactGroup = newContacts.filter(
        (c) => isDefined(c) && group.includes(c.id)
      ) as Contact[];
      if (contactGroup.some((c) => c.email !== user.email)) {
        requiredCredits++;
      }
    }
  }

  return requiredCredits;
}
