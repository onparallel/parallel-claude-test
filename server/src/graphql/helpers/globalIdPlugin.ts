import { ForbiddenError } from "apollo-server-express";
import {
  GraphQLInputType,
  GraphQLResolveInfo,
  isInputObjectType,
  isListType,
  isNonNullType,
  isScalarType,
} from "graphql";
import { core, dynamicInputMethod, dynamicOutputMethod, plugin } from "nexus";
import { isDefined, mapValues } from "remeda";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { If, UnwrapArray } from "../../util/types";

export type GlobalIdConfig = {
  prefixName: string;
};

export type GlobalIdInputFieldConfig<
  TypeName extends string,
  FieldName extends string
> = core.CommonInputFieldConfig<TypeName, FieldName> & GlobalIdConfig;

export type GlobalIdOutputFieldConfig<
  TypeName extends string,
  FieldName extends string,
  NeedsResolver extends boolean
> = If<
  NeedsResolver,
  GlobalIdResolverConfig<TypeName, FieldName>,
  Partial<GlobalIdResolverConfig<TypeName, FieldName>>
> &
  core.CommonOutputFieldConfig<TypeName, FieldName> &
  Partial<GlobalIdConfig>;

export type GlobalIdOutputFieldConfigSpread<TypeName extends string, FieldName extends string> = If<
  core.NeedsResolver<TypeName, FieldName>,
  // If a resolver is needed the config is required and with required resolver
  [GlobalIdOutputFieldConfig<TypeName, FieldName, true>],
  // If a resolver is **not** needed this makes the config optional with optional resolver
  [] | [GlobalIdOutputFieldConfig<TypeName, FieldName, false>]
>;

export type GlobalIdResolverConfig<TypeName extends string, FieldName extends string> = {
  resolve: GlobalIdFieldResolver<TypeName, FieldName>;
};

type GlobalIdFieldResolver<TypeName extends string, FieldName extends string> = (
  root: core.GetGen2<"rootTypes", TypeName>,
  args: core.ArgsValue<TypeName, FieldName>,
  context: core.GetGen<"context">,
  info: GraphQLResolveInfo
) => core.MaybePromise<GlobalIdFieldResolverReturnType<TypeName, FieldName>>;

/*
 * Build return type for resolver based on generated fieldType
 * e.g.:
 * - Maybe<string> -> Maybe<number>
 * - string -> number
 * - Maybe<string>[] -> Maybe<number>[]
 * - Maybe<Maybe<string>[]> -> Maybe<Maybe<number>[]>
 */
type GlobalIdFieldResolverReturnType<
  TypeName extends string,
  FieldName extends string
> = _GlobalIdFieldResolverReturnType<core.GetGen3<"fieldTypes", TypeName, FieldName>>;

type _GlobalIdFieldResolverReturnType<T> = _UnwrapIfNullList<T>;

type _UnwrapIfNullList<T> = If<
  IsNullable<T>,
  _UnwrapIfList<Exclude<T, null>> | null,
  _UnwrapIfList<T>
>;
type _UnwrapIfList<T> = If<IsArray<T>, _UnwrapIfNull<UnwrapArray<T>>[], _UnwrapIfNull<T>>;
type _UnwrapIfNull<T> = If<IsNullable<T>, number | null, number>;

type IsArray<T> = any[] extends T ? true : false;
type IsNullable<T> = null extends T ? true : false;

export function globalIdArg(
  prefixName: string,
  opts?: Omit<core.NexusArgConfig<"ID">, "type">
): core.NexusArgDef<any>;
export function globalIdArg(opts?: Omit<core.NexusArgConfig<"ID">, "type">): core.NexusArgDef<any>;
export function globalIdArg(
  prefixNameOrOpts?: string | Omit<core.NexusArgConfig<"ID">, "type">,
  opts?: Omit<core.NexusArgConfig<"ID">, "type">
): core.NexusArgDef<any> {
  const { extensions, ...config } =
    typeof prefixNameOrOpts === "string" ? opts ?? {} : prefixNameOrOpts ?? {};
  const prefixName = typeof prefixNameOrOpts === "string" ? prefixNameOrOpts : null;
  return core.arg({
    ...config,
    type: "GID" as any,
    extensions: {
      ...extensions,
      PREFIX_NAME: prefixName,
    },
  });
}

function mapGlobalIds(type: GraphQLInputType, value: any, prefixName?: string): any {
  if (isDefined(value)) {
    if (isScalarType(type) && type.name === "GID") {
      try {
        return fromGlobalId(value, prefixName).id;
      } catch {
        throw new ForbiddenError("Invalid ID");
      }
    } else if (isNonNullType(type)) {
      return mapGlobalIds(type.ofType, value, prefixName);
    } else if (isListType(type)) {
      return (value as any[]).map((item) => mapGlobalIds(type.ofType, item, prefixName));
    } else if (isInputObjectType(type)) {
      const result: any = {};
      for (const [name, field] of Object.entries(type.getFields())) {
        if (name in value) {
          const prefixName = (field.extensions as any)["PREFIX_NAME"] as string | undefined;
          result[name] = mapGlobalIds(field.type, value[name], prefixName);
        }
      }
      return result;
    } else {
      return value;
    }
  } else {
    return value;
  }
}

export function globalIdPlugin() {
  // Define the plugin with the appropriate configuration.
  return plugin({
    name: "GlobalIdPlugin",
    fieldDefTypes: [
      core.printedGenTypingImport({
        module: "./helpers/globalIdPlugin",
        bindings: ["GlobalIdOutputFieldConfigSpread", "GlobalIdInputFieldConfig"],
      }),
    ],
    onCreateFieldResolver({ fieldConfig, ...rest }) {
      const config = fieldConfig.extensions?.nexus?.config as core.NexusOutputFieldDef;
      return async function (root, args, ctx, info, next) {
        // decode any GID args
        const _args = mapValues(args ?? {}, (argValue, argName) => {
          const argConfig = fieldConfig.args![argName as string];
          const prefixName = (argConfig.extensions as any)["PREFIX_NAME"] as string | undefined;
          return mapGlobalIds(argConfig.type, argValue, prefixName);
        });
        const result = await next(root, _args, ctx, info);
        if (config.type === "GID") {
          const prefixName = (fieldConfig.extensions as any)["PREFIX_NAME"] as string;
          if (!isDefined(result)) {
            return result;
          } else if (config.wrapping?.includes("List") && Array.isArray(result)) {
            return result.map((x) => (isDefined(x) ? toGlobalId(prefixName, x) : null));
          } else {
            return toGlobalId(prefixName, result as number);
          }
        } else {
          return result;
        }
      };
    },
    onInstall(b) {
      b.addType(
        core.scalarType({
          name: "GID",
          sourceType: "number",
        })
      );
      b.addType(
        dynamicInputMethod({
          name: "globalId",
          typeDefinition: `<FieldName extends string>(
              fieldName: FieldName,
              opts: GlobalIdInputFieldConfig<TypeName, FieldName>
            ): void;
          `,
          factory({ typeDef: t, args: factoryArgs }) {
            const [fieldName, fieldConfig] = factoryArgs as [
              string,
              GlobalIdInputFieldConfig<any, any>
            ];
            const { prefixName, extensions, ...config } = fieldConfig;
            t.field(fieldName, {
              ...config,
              type: "GID",
              extensions: {
                ...extensions,
                PREFIX_NAME: prefixName,
              },
            });
          },
        })
      );
      b.addType(
        dynamicOutputMethod({
          name: "globalId",
          typeDefinition: `<FieldName extends string>(
              fieldName: FieldName,
              ...opts: GlobalIdOutputFieldConfigSpread<TypeName, FieldName>
            ): void;
          `,
          factory({ typeName, typeDef: t, args: factoryArgs }) {
            const [fieldName, fieldConfig = {}] = factoryArgs as [
              string,
              GlobalIdOutputFieldConfig<any, any, any>
            ];
            const { prefixName, extensions, ...config } = fieldConfig;
            t.field(fieldName, {
              ...config,
              type: "GID",
              extensions: {
                ...extensions,
                PREFIX_NAME: prefixName ?? typeName,
              },
            });
          },
        })
      );
    },
  });
}
