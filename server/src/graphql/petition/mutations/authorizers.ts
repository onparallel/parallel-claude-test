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

export function userHasPermissionOnPetitions<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string | string[]>
>(
  argName: TArg1,
  roles: MaybeArray<PetitionUserPermissionType>
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const { ids: petitionIds } = fromGlobalIds(
        unMaybeArray(args[argName]),
        "Petition"
      );
      const myPermissions = (
        await ctx.petitions.loadUserPermissions(petitionIds)
      )
        .flat()
        .filter((p) => p.user_id === ctx.user!.id);

      return myPermissions.every((p) => roles.includes(p.permission_type));
    } catch {}
    return false;
  };
}
