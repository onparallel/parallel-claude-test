import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";
import { isDefined } from "remeda";
import { ApiContext } from "../../../context";
import { partition, unMaybeArray } from "../../../util/arrays";
import { fromGlobalId } from "../../../util/globalId";
import { Maybe, MaybeArray } from "../../../util/types";
import { Arg } from "../../helpers/authorize";
import { contextUserHasAccessToUserGroups } from "../../user-group/authorizers";

async function contextUserHasAccessToUsers(userIds: number[], ctx: ApiContext) {
  try {
    if (userIds.length === 0) {
      return true;
    }
    // ids of users in my same organization
    return (await ctx.users.loadUser(userIds)).every(
      (u) => isDefined(u) && u.org_id === ctx.user!.org_id
    );
  } catch {}
  return false;
}

export function userHasAccessToUsers<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const userIds = unMaybeArray(args[argName] as MaybeArray<number>);
    return contextUserHasAccessToUsers(userIds, ctx);
  };
}

export function userHasAccessToUserOrUserGroupPublicLinkPermission<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, Maybe<{ id: string }[]>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const userOrUserGroupGlobalIds = args[argName] as Maybe<{ id: string }[]>;
      if (!userOrUserGroupGlobalIds) {
        return true;
      }
      const userOrUserGroupIds = userOrUserGroupGlobalIds.map(({ id }) => fromGlobalId(id));
      if (!userOrUserGroupIds.every((gid) => gid.type === "User" || gid.type === "UserGroup")) {
        return false;
      }
      const [userIds, userGroupIds] = partition(userOrUserGroupIds, (gid) => gid.type === "User");

      const [hasAccessToUsers, hasAccessToUserGroups] = await Promise.all([
        contextUserHasAccessToUsers(
          userIds.map(({ id }) => id),
          ctx
        ),
        contextUserHasAccessToUserGroups(
          userGroupIds.map(({ id }) => id),
          ctx
        ),
      ]);
      return hasAccessToUsers && hasAccessToUserGroups;
    } catch {}
    return false;
  };
}

export function argUserHasActiveStatus<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argNameUserId: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const userIds = unMaybeArray(args[argNameUserId] as MaybeArray<number>);
      if (userIds.length === 0) {
        return true;
      }

      return (await ctx.users.loadUser(userIds)).every(
        (u) => isDefined(u) && u.status === "ACTIVE"
      );
    } catch {}
    return false;
  };
}

export function userIsCommentAuthor<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argNameCommentId: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const comment = await ctx.petitions.loadPetitionFieldComment(
      args[argNameCommentId] as unknown as number
    );
    return (comment && comment.user_id === ctx.user!.id) ?? false;
  };
}

export function userHasAccessToPublicPetitionLink<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const publicPetitionLinkIds = unMaybeArray(args[argName] as MaybeArray<number>);
      const publicPetitionLinks = (
        await ctx.petitions.loadPublicPetitionLink(publicPetitionLinkIds)
      ).filter(isDefined);

      return await ctx.petitions.userHasAccessToPetitions(
        ctx.user!.id,
        publicPetitionLinks.map((ppl) => ppl.template_id)
      );
    } catch {}
    return false;
  };
}
