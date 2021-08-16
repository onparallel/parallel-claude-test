import { isDefined, uniq } from "remeda";
import { ApiContext } from "../context";
import { Contact, User } from "../db/__types";

export async function getRequiredPetitionSendCredits(
  contactIdGroups: number[][],
  user: User,
  ctx: ApiContext
) {
  let requiredCredits = 0;

  const contacts = await ctx.contacts.loadContact(uniq(contactIdGroups.flat()));

  for (const group of contactIdGroups) {
    const contactGroup = contacts.filter((c) => isDefined(c) && group.includes(c.id)) as Contact[];
    if (contactGroup.some((c) => c.email !== user.email)) {
      requiredCredits++;
    }
  }

  return requiredCredits;
}
