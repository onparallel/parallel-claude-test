import { Arg } from "../../helpers/authorize";
import { unMaybeArray } from "../../../util/arrays";
import { MaybeArray } from "../../../util/types";
import { isDefined } from "../../../util/remedaExtensions";
import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";

export function userHasAccessToUsers<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const userIds = unMaybeArray(args[argName] as MaybeArray<number>);
      if (userIds.length === 0) {
        return true;
      }
      // ids of users in my same organization
      return (await ctx.users.loadUser(userIds)).every(
        (u) => isDefined(u) && u.org_id === ctx.user!.org_id
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
      (args[argNameCommentId] as unknown) as number
    );
    return (comment && comment.user_id === ctx.user!.id) ?? false;
  };
}
