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

export function isOwnOrgOrSuperAdmin<
  FieldName extends string
>(): FieldAuthorizeResolver<"Organization", FieldName> {
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
    const integrations = await ctx.integrations.loadEnabledIntegrationsForOrgId(
      ctx.user!.org_id
    );
    if (integrations.find((i) => i.type === "SSO")) {
      throw new WhitelistedError(
        "Can't create users on organizations with a SSO provider",
        "SSO_PROVIDER_ENABLED"
      );
    }
    return true;
  };
}
