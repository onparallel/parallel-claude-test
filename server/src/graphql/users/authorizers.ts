import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";
import { WhitelistedError } from "../helpers/errors";

export function rootIsContextUser<
  FieldName extends string
>(): FieldAuthorizeResolver<"User", FieldName> {
  return (root, _, ctx) => {
    return ctx.user!.id === root.id;
  };
}

export function contextUserIsAdmin<
  TypeName extends string,
  FieldName extends string
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return (root, _, ctx) => {
    return ctx.user!.organization_role === "ADMIN";
  };
}

export function contextUserIsNotSso<
  TypeName extends string,
  FieldName extends string
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return (root, _, ctx) => {
    return ctx.user!.is_sso_user === false;
  };
}

export function orgDoesNotHaveSsoProvider<
  TypeName extends string,
  FieldName extends string
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx) => {
    const org = await ctx.organizations.loadOrg(ctx.user!.org_id);
    if (org?.sso_provider) {
      throw new WhitelistedError(
        "Can't create users on organizations with a SSO provider",
        "SSO_PROVIDER_ENABLED"
      );
    }
    return true;
  };
}
