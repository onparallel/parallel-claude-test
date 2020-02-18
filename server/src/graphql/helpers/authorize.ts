import { Context } from "../../context";
import { fromGlobalId } from "../../util/globalId";
import { FieldAuthorizeResolver } from "nexus";
import { UserOrganizationRole } from "../../db/__types";
import { MaybeArray } from "../../util/types";

export function authenticate<
  TypeName extends string,
  FieldName extends string
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, _, ctx) => {
    try {
      const authorization = ctx.req.header("Authorization");
      if (!authorization || !authorization.startsWith("Bearer ")) {
        throw new Error();
      }
      const token = authorization.replace("Bearer ", "");
      const cognitoId = await ctx.auth.validateSession(token);
      if (!cognitoId) {
        throw new Error();
      }
      const user = await ctx.users.loadOneByCognitoId(cognitoId);
      if (!user) {
        throw new Error();
      }
      ctx.user = user;
      return true;
    } catch {
      throw new NotAuthenticated();
    }
  };
}

export class NotAuthenticated extends Error {
  readonly name = "NotAuthenticated";
}

export function argIsContextUserId<
  TypeName extends string,
  FieldName extends string,
  T extends string
>(argName: T): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id } = fromGlobalId(args[argName], "User");
      return ctx.user.id === id;
    } catch {}
    return false;
  };
}

export function hasOrgRole<TypeName extends string, FieldName extends string>(
  role: MaybeArray<UserOrganizationRole>
): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_root, _, ctx: Context) => {
    return Array.isArray(role)
      ? role.includes(ctx.user.organization_role)
      : role === ctx.user.organization_role;
  };
}

export function authorizeAnd<TypeName extends string, FieldName extends string>(
  ...resolvers: FieldAuthorizeResolver<TypeName, FieldName>[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    for (const resolver of resolvers) {
      if (!(await resolver(root, args, ctx, info))) {
        return false;
      }
    }
    return true;
  };
}

export function authorizeOr<TypeName extends string, FieldName extends string>(
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
