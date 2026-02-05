import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isNonNullish } from "remeda";
import { IntegrationType } from "../../db/__types";
import { isAtLeast } from "../../util/profileTypeFieldPermission";
import { MaybeArray, unMaybeArray } from "../../util/types";
import { Arg, getArg } from "../helpers/authorize";
import { parseReplyToken } from "./utils";

export function userHasAccessToIntegrations<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  argName: TArg,
  types?: IntegrationType[],
  onlyEnabled?: boolean,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.integrations.userHasAccessToIntegration(
        unMaybeArray(getArg(args, argName)),
        ctx.user!,
        types,
        onlyEnabled,
      );
    } catch {}
    return false;
  };
}

export function authenticatePetitionOrProfileReplyToken<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>,
>(
  argName: TArg,
  fieldType: "BACKGROUND_CHECK" | "ADVERSE_MEDIA_SEARCH",
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const token = getArg(args, argName);
      const params = parseReplyToken(token);

      if ("petitionId" in params) {
        const petition = await ctx.petitions.loadPetition(params.petitionId);

        const results = await Promise.all([
          petition?.anonymized_at === null,
          petition?.deletion_scheduled_at === null,
          ctx.petitions.userHasAccessToPetitions(ctx.user!.id, [params.petitionId]),
          ctx.petitions.fieldsBelongToPetition(params.petitionId, [params.fieldId]),
          ctx.petitions.fieldHasType([params.fieldId], [fieldType]),
          ...(params.parentReplyId
            ? [
                ctx.petitions.replyIsForFieldOfType([params.parentReplyId], ["FIELD_GROUP"]),
                ctx.petitions.repliesBelongsToPetition(params.petitionId, [params.parentReplyId]),
              ]
            : [true]),
        ]);

        return results.every((r) => r);
      } else if ("profileId" in params) {
        const profile = await ctx.profiles.loadProfile(params.profileId);
        const profileTypeField = await ctx.profiles.loadProfileTypeField(params.profileTypeFieldId);
        const userPermission = await ctx.profiles.loadProfileTypeFieldUserEffectivePermission({
          profileTypeFieldId: params.profileTypeFieldId,
          userId: ctx.user!.id,
        });
        const userHasFeatureFlag = await ctx.featureFlags.userHasFeatureFlag(
          ctx.user!.id,
          "PROFILES",
        );

        const profileFieldValue = isNonNullish(params.profileFieldValueId)
          ? await ctx.profiles.loadProfileFieldValueById(params.profileFieldValueId)
          : null;

        const results = [
          userHasFeatureFlag, // user has feature flag
          profile?.anonymized_at === null, // profile is not anonymized
          profile?.org_id === ctx.user!.org_id, // user has access to profile
          profile?.profile_type_id === profileTypeField?.profile_type_id, // profile has profileTypeField
          profileTypeField?.type === fieldType, // profileTypeField is of type fieldType
          isAtLeast(userPermission, "READ"), // user has READ or WRITE permission on profileTypeField
          !params.profileFieldValueId || // if profileFieldValueId is provided, it must belong to the profile and profileTypeField
            (profileFieldValue?.profile_id === params.profileId &&
              profileFieldValue?.profile_type_field_id === params.profileTypeFieldId),
        ];

        return results.every((r) => r);
      } else {
        return false;
      }
    } catch {
      return false;
    }
  };
}
