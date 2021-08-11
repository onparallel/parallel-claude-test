import { core } from "@nexus/schema";
import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";
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

export function orgHasAvailableUserSeats<
  TypeName extends string,
  FieldName extends string
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, _, ctx) => {
    const [org, userCount] = await Promise.all([
      ctx.organizations.loadOrg(ctx.user!.org_id),
      ctx.organizations.loadUserCount(ctx.user!.org_id),
    ]);

    if (org!.usage_details.USER_SEATS <= userCount) {
      throw new WhitelistedError(`Not enough seats available`, "USER_SEATS_LIMIT_ERROR", {
        maxSeatsAvailable: org!.usage_details.USER_SEATS,
      });
    }
    return true;
  };
}

export function orgHasAvailablePetitionSendCredits<
  TypeName extends string,
  FieldName extends string
>(
  requiredCredits: (args: core.ArgsValue<TypeName, FieldName>) => number
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx) => {
    const needed = requiredCredits(args);
    const currentUsageLimit = await ctx.organizations.loadOrganizationCurrentUsageLimit(
      ctx.user!.org_id
    );
    const petitionSendUsageLimit = currentUsageLimit.find(
      (ul) => ul.limit_name === "PETITION_SEND"
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
