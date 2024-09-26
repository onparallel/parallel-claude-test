import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { IntegrationType } from "../../db/__types";
import { isAtLeast } from "../../util/profileTypeFieldPermission";
import { MaybeArray, unMaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";
import { parseBackgroundCheckToken } from "./utils";

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
        unMaybeArray(args[argName] as unknown as MaybeArray<number>),
        ctx.user!,
        types,
        onlyEnabled,
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

      if ("petitionId" in params) {
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
      } else if ("profileId" in params) {
        const profile = await ctx.profiles.loadProfile(params.profileId);
        const profileTypeField = await ctx.profiles.loadProfileTypeField(params.profileTypeFieldId);
        const userPermissions = await ctx.profiles.loadProfileTypeFieldUserEffectivePermission([
          { profileTypeFieldId: params.profileTypeFieldId, userId: ctx.user!.id },
        ]);
        const userHasFeatureFlag = await ctx.featureFlags.userHasFeatureFlag(
          ctx.user!.id,
          "PROFILES",
        );

        const results = [
          userHasFeatureFlag, // user has feature flag
          profile?.anonymized_at === null, // profile is not anonymized
          profile?.org_id === ctx.user!.org_id, // user has access to profile
          profile?.profile_type_id === profileTypeField?.profile_type_id, // profile has profileTypeField
          profileTypeField?.type === "BACKGROUND_CHECK", // profileTypeField is BACKGROUND_CHECK
          userPermissions.every((p) => isAtLeast(p, "READ")), // user has READ or WRITE permission on profileTypeField
        ];

        return results.every((r) => r);
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  };
}
