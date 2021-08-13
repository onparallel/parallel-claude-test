import { ApiContext } from "../context";
import { User } from "../db/__types";

export async function getRequiredPetitionSendCredits(
  contactIdGroups: number[][],
  user: User,
  ctx: ApiContext
) {
  let requiredCredits = 0;

  for (const group of contactIdGroups) {
    const contactGroup = await ctx.contacts.loadContact(group);
    if (contactGroup.some((c) => c && c.email !== user.email)) {
      requiredCredits++;
    }
  }

  return requiredCredits;
}
