import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

export function userHasAccessToAuthTokens<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const userAuthTokenIds = unMaybeArray(
        args[argName] as unknown as MaybeArray<number>
      );
      return await ctx.userAuthentication.userHasAccessToAuthTokens(
        userAuthTokenIds,
        ctx.user!.id
      );
    } catch {}
    return false;
  };
}
