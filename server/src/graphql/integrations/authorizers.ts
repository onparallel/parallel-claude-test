import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { IntegrationType } from "../../db/__types";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";
import { parseBackgroundCheckToken } from "./utils";

export function userHasAccessToIntegrations<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argName: TArg, types?: IntegrationType[]): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.integrations.userHasAccessToIntegration(
        unMaybeArray(args[argName] as unknown as MaybeArray<number>),
        ctx.user!,
        types,
      );
    } catch {}
    return false;
  };
}

export function authenticateBackgroundCheckToken<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>,
>(tokenArg: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const token = args[tokenArg] as unknown as string;
      const params = parseBackgroundCheckToken(token);

      const petition = await ctx.petitions.loadPetition(params.petitionId);

      const results = await Promise.all([
        petition?.anonymized_at === null,
        ctx.petitions.userHasAccessToPetitions(ctx.user!.id, [params.petitionId]),
        ctx.petitions.fieldsBelongToPetition(params.petitionId, [params.fieldId]),
        ctx.petitions.fieldHasType([params.fieldId], ["BACKGROUND_CHECK"]),
        ...(params.parentReplyId
          ? [
              ctx.petitions.replyIsForFieldOfType([params.parentReplyId], ["FIELD_GROUP"]),
              ctx.petitions.repliesBelongsToPetition(params.petitionId, [params.parentReplyId]),
            ]
          : [true]),
      ]);

      return results.every((r) => r);
    } catch (e) {
      return false;
    }
  };
}
