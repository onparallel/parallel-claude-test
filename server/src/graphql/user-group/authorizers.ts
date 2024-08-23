import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isNonNullish, isNullish } from "remeda";
import { ApiContext } from "../../context";
import { UserGroupType } from "../../db/__types";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

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
    if (isNullish(args[argName])) {
      return true;
    }
    const userGroupIds = unMaybeArray(args[argName]) as unknown as number[];
    return await contextUserHasAccessToUserGroups(userGroupIds, ctx);
  };
}

export function userGroupHasType<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number> | null | undefined>,
>(argName: TArg, types: MaybeArray<UserGroupType>): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    if (isNullish(args[argName])) {
      return true;
    }
    const userGroupIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
    const userGroups = await ctx.userGroups.loadUserGroup(userGroupIds);
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
    if (isNullish(args[argName])) {
      return false;
    }
    const userGroupIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
    const userGroups = await ctx.userGroups.loadUserGroup(userGroupIds);

    if (userGroups.some((ug) => isNullish(ug) || ug.type === "ALL_USERS")) {
      return false;
    }

    if (userGroups.some((ug) => ug!.type === "INITIAL")) {
      return ctx.featureFlags.userHasFeatureFlag(ctx.user!.id, "PERMISSION_MANAGEMENT");
    }

    return true;
  };
}
