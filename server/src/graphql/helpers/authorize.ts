import { core } from "@nexus/schema";
import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";
import { AuthenticationError } from "apollo-server-express";
import { every, everySeries } from "async";
import { ApiContext } from "../../context";
import { UserOrganizationRole } from "../../db/__types";
import { getTokenFromRequest } from "../../util/getTokenFromRequest";
import { isDefined } from "../../util/remedaExtensions";
import { KeysOfType, MaybeArray } from "../../util/types";

export function authenticate<
  TypeName extends string,
  FieldName extends string
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, _, ctx) => {
    const token = getTokenFromRequest(ctx.req);
    if (!token) {
      throw new AuthenticationError("Invalid session");
    }
    const cognitoId = await ctx.auth.validateSession(token);
    if (!cognitoId) {
      throw new AuthenticationError("Invalid session");
    }
    const user = await ctx.users.loadSessionUser(cognitoId);
    if (!user || user.status === "INACTIVE") {
      throw new AuthenticationError("User not found");
    }
    ctx.user = user;
    return true;
  };
}

export function checkClientServerToken<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>
>(tokenArg: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx) => {
    return ctx.security.checkClientServerToken(
      (args[tokenArg] as unknown) as string
    );
  };
}

export function authenticateAnd<
  TypeName extends string,
  FieldName extends string
>(
  ...resolvers: FieldAuthorizeResolver<TypeName, FieldName>[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return chain(authenticate(), and(...resolvers));
}

export type Arg<
  TypeName extends string,
  FieldName extends string,
  Type = any
> = KeysOfType<core.ArgsValue<TypeName, FieldName>, Type>;

export function argIsContextUserId<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      return ctx.user!.id === ((args[argName] as unknown) as number);
    } catch {}
    return false;
  };
}

export function hasOrgRole<TypeName extends string, FieldName extends string>(
  role: MaybeArray<UserOrganizationRole>
): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_root, _, ctx: ApiContext) => {
    return Array.isArray(role)
      ? role.includes(ctx.user!.organization_role)
      : role === ctx.user!.organization_role;
  };
}

export function chain<TypeName extends string, FieldName extends string>(
  ...resolvers: FieldAuthorizeResolver<TypeName, FieldName>[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    return ((await everySeries(
      resolvers,
      async (resolver) => await resolver(root, args, ctx, info)
    )) as unknown) as boolean;
  };
}

export function and<TypeName extends string, FieldName extends string>(
  ...resolvers: FieldAuthorizeResolver<TypeName, FieldName>[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    return ((await every(
      resolvers,
      async (resolver) => await resolver(root, args, ctx, info)
    )) as unknown) as boolean;
  };
}

export function or<TypeName extends string, FieldName extends string>(
  ...resolvers: FieldAuthorizeResolver<TypeName, FieldName>[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    for (const resolver of resolvers) {
      if (await resolver(root, args, ctx, info)) {
        return true;
      }
    }
    return false;
  };
}
export function ifArgDefined<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName>
>(
  argName: TArg,
  authorizer: FieldAuthorizeResolver<TypeName, FieldName>
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    if (isDefined(args[argName])) {
      return await authorizer(root, args, ctx, info);
    }
    return true;
  };
}

export function ifArgEquals<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName>
>(
  argName: TArg,
  expectedValue: core.ArgsValue<TypeName, FieldName>[TArg],
  authorizer: FieldAuthorizeResolver<TypeName, FieldName>
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    if (args[argName] === expectedValue) {
      return await authorizer(root, args, ctx, info);
    }
    return true;
  };
}

export function userIsSuperAdmin<
  TypeName extends string,
  FieldName extends string
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const user = ctx.user!;
      const org = await ctx.organizations.loadOrg(user.org_id);
      return (
        org!.identifier === "parallel" && user.organization_role === "ADMIN"
      );
    } catch {}
    return false;
  };
}
