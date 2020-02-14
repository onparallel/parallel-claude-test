import { Context } from "../../context";
import { fromGlobalId } from "../../util/globalId";
import { GraphQLResolveInfo } from "graphql";
import { FieldAuthorizeResolver } from "nexus";
import { UserOrganizationRole } from "../../db/__types";
import { MaybeArray } from "../../util/types";

export async function authenticate(
  _root: any,
  _args: any,
  context: Context,
  _info: GraphQLResolveInfo
) {
  try {
    const authorization = context.req.header("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new Error();
    }
    const token = authorization.replace("Bearer ", "");
    const cognitoId = await context.auth.validateSession(token);
    if (!cognitoId) {
      throw new Error();
    }
    const user = await context.users.loadOneByCognitoId(cognitoId);
    if (!user) {
      throw new Error();
    }
    context.user = user;
    return true;
  } catch {
    throw new NotAuthenticated();
  }
}

export class NotAuthenticated extends Error {
  readonly name = "NotAuthenticated";
}

export function isContextUserId<T extends string>(argName: T) {
  return (_root: any, args: Record<T, string>, ctx: Context) => {
    try {
      const { id } = fromGlobalId(args[argName], "User");
      return ctx.user.id === id;
    } catch {}
    return false;
  };
}

export function hasOrgRole(role: MaybeArray<UserOrganizationRole>) {
  return (_root: any, args: any, ctx: Context) => {
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
