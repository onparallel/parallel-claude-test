import { Arg } from "../../helpers/authorize";
import { FieldAuthorizeResolver } from "@nexus/schema";
import { fromGlobalIds } from "../../../util/globalId";
import { unMaybeArray } from "../../../util/arrays";
import { PetitionUserPermissionType } from "../../../db/__types";
import { MaybeArray } from "../../../util/types";

export function userHasAccessToUsers<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string | string[]>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const { ids: userIds } = fromGlobalIds(
        unMaybeArray(args[argName]),
        "User"
      );
      if (userIds.length === 0) {
        return true;
      }
      // ids of users in my same organization
      const orgUserIds = (await ctx.users.loadUsers(userIds))
        .filter((u) => u.org_id === ctx.user!.org_id)
        .map((u) => u.id);

      return userIds.every((userId) => orgUserIds.includes(userId));
    } catch {}
    return false;
  };
}
