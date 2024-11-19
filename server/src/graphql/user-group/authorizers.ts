import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isNonNullish, isNullish } from "remeda";
import { ApiContext } from "../../context";
import { UserGroupType } from "../../db/__types";
import { MaybeArray, unMaybeArray } from "../../util/types";
import { Arg, getArg } from "../helpers/authorize";

export async function contextUserHasAccessToUserGroups(userGroupIds: number[], ctx: ApiContext) {
  if (userGroupIds.length === 0) {
    return true;
  }
  return (await ctx.userGroups.loadUserGroup(userGroupIds)).every(
    (ug) => isNonNullish(ug) && ug.org_id === ctx.user!.org_id,
  );
}

export function userHasAccessToUserGroups<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number> | null | undefined>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const userGroupIds = getArg(args, argName);
    if (isNullish(userGroupIds)) {
      return true;
    }
    return await contextUserHasAccessToUserGroups(unMaybeArray(userGroupIds), ctx);
  };
}

export function userGroupHasType<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number> | null | undefined>,
>(argName: TArg, types: MaybeArray<UserGroupType>): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const userGroupIds = getArg(args, argName);
    if (isNullish(userGroupIds)) {
      return true;
    }
    const userGroups = await ctx.userGroups.loadUserGroup(unMaybeArray(userGroupIds));
    const allowedTypes = unMaybeArray(types);

    return userGroups.every((ug) => isNonNullish(ug) && allowedTypes.includes(ug.type));
  };
}

export function userGroupCanBeDeleted<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number> | null | undefined>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const userGroupIds = getArg(args, argName);
    if (isNullish(userGroupIds)) {
      return false;
    }
    const userGroups = await ctx.userGroups.loadUserGroup(unMaybeArray(userGroupIds));

    if (userGroups.some((ug) => isNullish(ug) || ug.type === "ALL_USERS")) {
      return false;
    }

    if (userGroups.some((ug) => ug!.type === "INITIAL")) {
      return ctx.featureFlags.userHasFeatureFlag(ctx.user!.id, "PERMISSION_MANAGEMENT");
    }

    return true;
  };
}
