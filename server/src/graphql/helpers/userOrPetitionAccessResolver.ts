import { isDefined } from "remeda";
import { ApiContext } from "../../context";
import { PetitionAccess, User } from "../../db/__types";

export async function userOrPetitionAccessResolver(
  root: { data: { user_id?: number; petition_access_id?: number } },
  _: {},
  ctx: ApiContext
): Promise<(User & { __type: "User" }) | (PetitionAccess & { __type: "PetitionAccess" }) | null> {
  if (isDefined(root.data.user_id)) {
    const user = await ctx.users.loadUser(root.data.user_id);
    return user && { __type: "User", ...user };
  } else if (isDefined(root.data.petition_access_id)) {
    const access = await ctx.petitions.loadAccess(root.data.petition_access_id);
    return access && { __type: "PetitionAccess", ...access };
  }
  throw new Error(`Both "user_id" and "petition_access_id" are null`);
}
