import { ForbiddenError } from "apollo-server-errors";
import {
  GraphQLInputType,
  GraphQLResolveInfo,
  isListType,
  isNonNullType,
  isScalarType,
} from "graphql";
import { core, dynamicOutputMethod, plugin } from "nexus";
import { isDefined, mapValues, omit } from "remeda";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { If, UnwrapArray } from "../../util/types";

export type GlobalIdConfig = {
  prefixName?: string;
};

export type GlobalIdConfigSpread<
  TypeName extends string,
  FieldName extends string
> = core.NeedsResolver<TypeName, FieldName> extends true
  ? [
      GlobalIdConfig &
        GlobalIdResolverConfig<TypeName, FieldName> &
        core.CommonOutputFieldConfig<TypeName, FieldName>
    ]
  :
      | []
      | [
          GlobalIdConfig &
            Partial<GlobalIdResolverConfig<TypeName, FieldName>> &
            core.CommonOutputFieldConfig<TypeName, FieldName>
        ];

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
  opts = typeof prefixNameOrOpts === "string" ? opts : prefixNameOrOpts ?? {};
  const prefixName = typeof prefixNameOrOpts === "string" ? prefixNameOrOpts : null;
  return core.arg({
    ...{
      [PREFIX_NAME]: prefixName,
    },
    type: "GID" as any,
    ...opts,
  });
}

const PREFIX_NAME = Symbol.for("PREFIX_NAME");

function mapGlobalIds(type: GraphQLInputType, value: any, argConfig: core.AllNexusArgsDefs): any {
  if (isScalarType(type)) {
    if (type.name === "GID" && isDefined(value)) {
      try {
        return fromGlobalId(value, ((argConfig as core.NexusArgDef<any>).value as any)[PREFIX_NAME])
          .id;
      } catch {
        throw new ForbiddenError("Invalid ID");
      }
    } else {
      return value;
    }
  } else if (isNonNullType(type)) {
    return mapGlobalIds(type.ofType, value, (argConfig as core.NexusNonNullDef<any>).ofNexusType);
  } else if (isListType(type)) {
    return isDefined(value)
      ? (value as any[]).map((item) =>
          mapGlobalIds(type.ofType, item, (argConfig as core.NexusListDef<any>).ofNexusType)
        )
      : value;
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
        bindings: ["GlobalIdConfigSpread"],
      }),
    ],
    onCreateFieldResolver({ fieldConfig }) {
      const config = fieldConfig.extensions?.nexus?.config as core.NexusOutputFieldDef;
      return async function (root, args, ctx, info, next) {
        // decode any GID args
        const _args = mapValues(args ?? {}, (argValue, argName) => {
          const type = fieldConfig.args![argName as string].type;
          const argConfig = config.args![argName as string];
          return mapGlobalIds(type, argValue, argConfig);
        });
        const result = await next(root, _args, ctx, info);
        if (config.type === "GID") {
          const prefixName = (config as any)[PREFIX_NAME] as string;
          if (!isDefined(result)) {
            return result;
          } else if (config.wrapping?.includes("List") && Array.isArray(result)) {
            return result.map((x) => (isDefined(x) ? toGlobalId(prefixName, x) : null));
          } else {
            return toGlobalId(prefixName, result);
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
        dynamicOutputMethod({
          name: "globalId",
          typeDefinition: `<FieldName extends string>(
              fieldName: FieldName,
              ...opts: GlobalIdConfigSpread<TypeName, FieldName>
            ): void;
          `,
          factory({ typeName, typeDef: t, args: factoryArgs }) {
            const [fieldName, fieldConfig] = factoryArgs as [string, any];
            const prefixName = fieldConfig?.prefixName ?? typeName;
            t.field(fieldName, {
              ...{
                [PREFIX_NAME]: prefixName,
              },
              ...omit(fieldConfig ?? {}, ["prefixName"]),
              type: "GID",
            });
          },
        })
      );
    },
  });
}
