import { core } from "nexus";
import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import pAll from "p-all";
import { isDefined } from "remeda";
import { getClientIp } from "request-ip";
import { authenticateFromRequest } from "../../util/authenticateFromRequest";
import { withError } from "../../util/promises/withError";
import { KeysOfType } from "../../util/types";
import { ApolloError, AuthenticationError, ForbiddenError } from "./errors";

export type ArgAuthorizer<TArg, TRest extends any[] = []> = <
  TypeName extends string,
  FieldName extends string,
  TArgName extends Arg<TypeName, FieldName, TArg>,
>(
  argName: TArgName,
  ...args: TRest
) => FieldAuthorizeResolver<TypeName, FieldName>;

export function authenticate<
  TypeName extends string,
  FieldName extends string,
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, _, ctx) => {
    try {
      if (!(await authenticateFromRequest(ctx.req, ctx))) {
        throw new Error();
      }
      return true;
    } catch (e) {
      throw new AuthenticationError("Invalid session");
    }
  };
}

export function checkClientServerToken<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>,
>(tokenArg: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx) => {
    return (args[tokenArg] as unknown as string) === ctx.config.misc.clientServerToken;
  };
}

export function authenticateAnd<TypeName extends string, FieldName extends string>(
  ...resolvers: FieldAuthorizeResolver<TypeName, FieldName>[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return chain(authenticate(), and(...resolvers));
}

export type Arg<TypeName extends string, FieldName extends string, Type = any> = string &
  KeysOfType<core.ArgsValue<TypeName, FieldName>, Type>;

function _all<TypeName extends string, FieldName extends string>(
  resolvers: FieldAuthorizeResolver<TypeName, FieldName>[],
  concurrency: number,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    await pAll(
      resolvers.map((resolver) => async () => {
        const [error, passes] = await withError(Promise.resolve(resolver(root, args, ctx, info)));
        if (typeof passes === "boolean" && passes) {
          return true;
        } else {
          if (typeof passes === "boolean") {
            throw new ForbiddenError("Not authorized");
          } else {
            throw passes ?? error;
          }
        }
      }),
      { concurrency },
    );
    return true;
  };
}

export function chain<TypeName extends string, FieldName extends string>(
  ...resolvers: FieldAuthorizeResolver<TypeName, FieldName>[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return _all(resolvers, 1);
}

export function and<TypeName extends string, FieldName extends string>(
  ...resolvers: FieldAuthorizeResolver<TypeName, FieldName>[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return _all(resolvers, Infinity);
}

export function or<TypeName extends string, FieldName extends string>(
  ...resolvers: FieldAuthorizeResolver<TypeName, FieldName>[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    const results = [];
    for (const resolver of resolvers) {
      const [error, passes] = await withError(Promise.resolve(resolver(root, args, ctx, info)));
      if (typeof passes === "boolean" && passes) {
        return true;
      } else {
        results.push(passes ?? error);
      }
    }
    throw new ForbiddenError("No conditions passed", {
      conditions: results.map((r) => (r instanceof ApolloError ? [r.message, r.extensions] : r)),
    });
  };
}

export function ifArgDefined<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName>,
>(
  prop: TArg | ((args: core.ArgsValue<TypeName, FieldName>) => any),
  thenAuthorizer: FieldAuthorizeResolver<TypeName, FieldName>,
  elseAuthorizer?: FieldAuthorizeResolver<TypeName, FieldName>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    const value = typeof prop === "string" ? (args as any)[prop] : (prop as any)(args);
    if (isDefined(value)) {
      return await thenAuthorizer(root, args, ctx, info);
    } else if (elseAuthorizer) {
      return await elseAuthorizer(root, args, ctx, info);
    }
    return true;
  };
}

export function ifSomeDefined<TypeName extends string, FieldName extends string>(
  props: (args: core.ArgsValue<TypeName, FieldName>) => any[],
  thenAuthorizer: FieldAuthorizeResolver<TypeName, FieldName>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    if (props(args).some((value) => value !== undefined)) {
      return await thenAuthorizer(root, args, ctx, info);
    }
    return true;
  };
}

export function ifArgEquals<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName>,
>(
  prop: TArg | ((args: core.ArgsValue<TypeName, FieldName>) => any),
  expectedValue: core.ArgsValue<TypeName, FieldName>[TArg],
  thenAuthorizer: FieldAuthorizeResolver<TypeName, FieldName>,
  elseAuthorizer?: FieldAuthorizeResolver<TypeName, FieldName>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    const value = typeof prop === "string" ? (args as any)[prop] : (prop as any)(args);
    if (value === expectedValue) {
      return await thenAuthorizer(root, args, ctx, info);
    } else if (elseAuthorizer) {
      return await elseAuthorizer(root, args, ctx, info);
    }
    return true;
  };
}

export function ifNotEmptyArray<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, any[]>,
>(
  prop: TArg,
  thenAuthorizer: FieldAuthorizeResolver<TypeName, FieldName>,
  elseAuthorizer?: FieldAuthorizeResolver<TypeName, FieldName>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    const array = args[prop] as unknown as any[];
    if (array.length > 0) {
      return await thenAuthorizer(root, args, ctx, info);
    } else if (elseAuthorizer) {
      return await elseAuthorizer(root, args, ctx, info);
    }
    return true;
  };
}

export function argIsDefined<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    return isDefined(args[argName]);
  };
}

export function userIsSuperAdmin<
  TypeName extends string,
  FieldName extends string,
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const [org, permissions] = await Promise.all([
        ctx.organizations.loadOrg(ctx.user!.org_id),
        ctx.users.loadUserPermissions(ctx.user!.id),
      ]);

      return org?.status === "ROOT" && permissions.includes("SUPERADMIN");
    } catch {}
    return false;
  };
}

export function verifyCaptcha<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx) => {
    return await ctx.auth.verifyCaptcha(
      args[argName] as unknown as string,
      getClientIp(ctx.req) ?? "",
    );
  };
}

/**
 * negates the result of the given resolver
 */
export function not<TypeName extends string, FieldName extends string>(
  resolver: FieldAuthorizeResolver<TypeName, FieldName>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    try {
      return !(await resolver(root, args, ctx, info));
    } catch {
      return true;
    }
  };
}
