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

  // count credits if the context user is the only one with previous access to this petition (or nobody has access yet)
  if (currentContacts.every((c) => c.email === user.email)) {
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
