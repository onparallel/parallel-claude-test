import { AuthenticationError } from "apollo-server-express";
import { core } from "nexus";
import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import fetch from "node-fetch";
import pAll from "p-all";
import { isDefined } from "remeda";
import { getClientIp } from "request-ip";
import { URLSearchParams } from "url";
import { authenticateFromRequest } from "../../util/authenticateFromRequest";
import { KeysOfType } from "../../util/types";
import { userHasRole } from "../../util/userHasRole";

export function authenticate<
  TypeName extends string,
  FieldName extends string
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, _, ctx) => {
    try {
      await authenticateFromRequest(ctx.req, ctx);
      return true;
    } catch (e) {
      console.log(e);
      throw new AuthenticationError("Invalid session");
    }
  };
}

export function checkClientServerToken<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>
>(tokenArg: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx) => {
    return ctx.security.checkClientServerToken(args[tokenArg] as unknown as string);
  };
}

export function authenticateAnd<TypeName extends string, FieldName extends string>(
  ...resolvers: FieldAuthorizeResolver<TypeName, FieldName>[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return chain(authenticate(), and(...resolvers));
}

export type Arg<TypeName extends string, FieldName extends string, Type = any> = KeysOfType<
  core.ArgsValue<TypeName, FieldName>,
  Type
>;

export function argIsContextUserId<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      return ctx.user!.id === (args[argName] as unknown as number);
    } catch {}
    return false;
  };
}

function _all<TypeName extends string, FieldName extends string>(
  resolvers: FieldAuthorizeResolver<TypeName, FieldName>[],
  concurrency: number
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    try {
      await pAll(
        resolvers.map((resolver) => async () => {
          const passes = await resolver(root, args, ctx, info);
          if (typeof passes === "boolean") {
            if (!passes) {
              throw new Error("Not authorized");
            }
            return true;
          } else {
            throw passes;
          }
        }),
        { concurrency }
      );
    } catch (e: any) {
      // recapture "Not authorized" error, rethrow otherwise
      if (e.message === "Not authorized") {
        return false;
      }
      throw e;
    }
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
  prop: TArg | ((args: core.ArgsValue<TypeName, FieldName>) => any),
  thenAuthorizer: FieldAuthorizeResolver<TypeName, FieldName>,
  elseAuthorizer?: FieldAuthorizeResolver<TypeName, FieldName>
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
  thenAuthorizer: FieldAuthorizeResolver<TypeName, FieldName>
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
  TArg extends Arg<TypeName, FieldName>
>(
  argName: TArg,
  expectedValue: core.ArgsValue<TypeName, FieldName>[TArg],
  thenAuthorizer: FieldAuthorizeResolver<TypeName, FieldName>,
  elseAuthorizer?: FieldAuthorizeResolver<TypeName, FieldName>
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    if (args[argName] === expectedValue) {
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
  TArg extends Arg<TypeName, FieldName>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    return isDefined(args[argName]);
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
      return org?.status === "ROOT" && userHasRole(user, "ADMIN");
    } catch {}
    return false;
  };
}

export function verifyCaptcha<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    const url = `https://google.com/recaptcha/api/siteverify?${new URLSearchParams({
      secret: ctx.config.recaptcha.secretKey,
      response: args[argName] as unknown as string,
      remoteip: getClientIp(ctx.req) ?? "",
    })}`;
    const response = await fetch(url);
    const body = await response.json();
    return body.success ?? false;
  };
}
