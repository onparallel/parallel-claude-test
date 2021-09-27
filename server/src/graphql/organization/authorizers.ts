import { core } from "nexus";
import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { getRequiredPetitionSendCredits } from "../../util/organizationUsageLimits";
import { Arg, or, userIsSuperAdmin } from "../helpers/authorize";
import { WhitelistedError } from "../helpers/errors";
export function isOwnOrg<FieldName extends string>(): FieldAuthorizeResolver<
  "Organization",
  FieldName
> {
  return (root, _, ctx) => {
    return ctx.user!.org_id === root.id;
  };
}

export function isOwnOrgOrSuperAdmin<FieldName extends string>(): FieldAuthorizeResolver<
  "Organization",
  FieldName
> {
  return or(isOwnOrg(), userIsSuperAdmin());
}

export function contextUserBelongsToOrg<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      return ctx.user!.org_id === (args[argName] as unknown as number);
    } catch {}
    return false;
  };
}

export function orgDoesNotHaveSsoProvider<
  TypeName extends string,
  FieldName extends string
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx) => {
    const integrations = await ctx.integrations.loadEnabledIntegrationsForOrgId(ctx.user!.org_id);
    if (integrations.find((i) => i.type === "SSO")) {
      throw new WhitelistedError(
        "Can't create users on organizations with a SSO provider",
        "SSO_PROVIDER_ENABLED"
      );
    }
    return true;
  };
}

export function orgCanCreateNewUser<
  TypeName extends string,
  FieldName extends string
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, _, ctx) => {
    const [org, userCount] = await Promise.all([
      ctx.organizations.loadOrg(ctx.user!.org_id),
      ctx.organizations.loadUserCount(ctx.user!.org_id),
    ]);

    if (org!.usage_details.USER_LIMIT <= userCount) {
      throw new WhitelistedError(`User limit reached for this organization`, "USER_LIMIT_ERROR", {
        userLimit: org!.usage_details.USER_LIMIT,
      });
    }
    return true;
  };
}

export function orgHasAvailablePetitionSendCredits<
  TypeName extends string,
  FieldName extends string
>(
  petitionIdProp: (args: core.ArgsValue<TypeName, FieldName>) => number,
  contactIdGroupsProp: (args: core.ArgsValue<TypeName, FieldName>) => number[][]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = petitionIdProp(args);

    const needed = await getRequiredPetitionSendCredits(
      petitionId,
      contactIdGroupsProp(args),
      ctx.user!,
      ctx
    );

    const petitionSendUsageLimit = await ctx.organizations.getOrganizationCurrentUsageLimit(
      ctx.user!.org_id,
      "PETITION_SEND"
    );

    if (
      !petitionSendUsageLimit ||
      petitionSendUsageLimit.used + needed > petitionSendUsageLimit.limit
    ) {
      throw new WhitelistedError(
        `Not enough credits to send the petition`,
        "PETITION_SEND_CREDITS_ERROR",
        {
          needed,
          used: petitionSendUsageLimit?.used || 0,
          limit: petitionSendUsageLimit?.limit || 0,
        }
      );
    }
    return true;
  };
}
