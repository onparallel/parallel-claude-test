import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isDefined } from "remeda";
import { OrganizationThemeType, OrganizationUsageLimitName } from "../../db/__types";
import { Arg, or, userIsSuperAdmin } from "../helpers/authorize";
import { ApolloError } from "../helpers/errors";
import { core } from "nexus";

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
  TArg extends Arg<TypeName, FieldName, number>,
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
  FieldName extends string,
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx) => {
    const ssoIntegrations = await ctx.integrations.loadIntegrationsByOrgId(ctx.user!.org_id, "SSO");
    if (ssoIntegrations.length > 0) {
      throw new ApolloError(
        "Can't create users on organizations with a SSO provider",
        "SSO_PROVIDER_ENABLED",
      );
    }
    return true;
  };
}

export function orgCanCreateNewUser<
  TypeName extends string,
  FieldName extends string,
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, _, ctx) => {
    const [org, activeUserCount] = await Promise.all([
      ctx.organizations.loadOrg(ctx.user!.org_id),
      ctx.organizations.loadActiveUserCount(ctx.user!.org_id),
    ]);

    if (org!.usage_details.USER_LIMIT <= activeUserCount) {
      throw new ApolloError(`User limit reached for this organization`, "USER_LIMIT_ERROR", {
        userLimit: org!.usage_details.USER_LIMIT,
      });
    }
    return true;
  };
}

export function userHasAccessToOrganizationTheme<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(argName: TArg, themeType?: OrganizationThemeType): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const theme = await ctx.organizations.loadOrganizationTheme(
        args[argName] as unknown as number,
      );
      return (
        theme?.org_id === ctx.user!.org_id &&
        ((isDefined(themeType) && theme.type === themeType) || !isDefined(themeType))
      );
    } catch {}
    return false;
  };
}

export function organizationThemeIsNotDefault<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const theme = await ctx.organizations.loadOrganizationTheme(
        args[argName] as unknown as number,
      );
      return theme?.is_default === false;
    } catch {}
    return false;
  };
}

export function organizationHasOngoingUsagePeriod<
  TypeName extends string,
  FieldName extends string,
  TOrgIdArg extends Arg<TypeName, FieldName, number>,
  TLimitNameArg extends Arg<TypeName, FieldName, OrganizationUsageLimitName>,
>(orgIdArg: TOrgIdArg, limitNameArg: TLimitNameArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const orgId = args[orgIdArg] as unknown as number;
      const limitName = args[limitNameArg] as unknown as OrganizationUsageLimitName;

      const limit = await ctx.organizations.loadCurrentOrganizationUsageLimit(orgId, limitName);
      return isDefined(limit);
    } catch {}
    return false;
  };
}

export function organizationHasEnoughPetitionSendCredits<
  TypeName extends string,
  FieldName extends string,
  TPetitionIdArg extends Arg<TypeName, FieldName, number>,
>(
  petitionIdArg: TPetitionIdArg,
  contactGroupsLength: (args: core.ArgsValue<TypeName, FieldName>) => number,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = args[petitionIdArg] as unknown as number;

    const petition = await ctx.petitions.loadPetition(petitionId);

    const creditsRequired = contactGroupsLength(args) - petition!.credits_used;

    if (creditsRequired > 0) {
      const usageLimit = await ctx.organizations.loadCurrentOrganizationUsageLimit(
        petition!.org_id,
        "PETITION_SEND",
      );

      if (!usageLimit || usageLimit.used + creditsRequired > usageLimit.limit) {
        throw new ApolloError(
          "You don't have enough credits to send all the petitions",
          "PETITION_SEND_LIMIT_REACHED",
        );
      }
    }

    return true;
  };
}
