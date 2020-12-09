import { core, dynamicOutputMethod, plugin } from "@nexus/schema";
import {
  GraphQLInputType,
  GraphQLResolveInfo,
  isListType,
  isNonNullType,
  isScalarType,
} from "graphql";
import { mapValues, omit } from "remeda";
import { fromGlobalId, fromGlobalIds, toGlobalId } from "../../util/globalId";
import { isDefined } from "../../util/remedaExtensions";

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

export type GlobalIdResolverConfig<
  TypeName extends string,
  FieldName extends string
> = { resolve: FieldResolverWithReturnType<TypeName, FieldName, number> };

type FieldResolverWithReturnType<
  TypeName extends string,
  FieldName extends string,
  ReturnType
> = (
  root: core.RootValue<TypeName>,
  args: core.ArgsValue<TypeName, FieldName>,
  context: core.GetGen<"context">,
  info: GraphQLResolveInfo
) => core.MaybePromise<
  ResultValueWithReturnType<TypeName, FieldName, ReturnType>
>;

type ResultValueWithReturnType<
  TypeName extends string,
  FieldName extends string,
  ReturnType
> = IsNullable<core.GetGen3<"fieldTypes", TypeName, FieldName>> extends true
  ? ReturnType | null
  : ReturnType;

type IsNullable<T> = null extends T ? true : false;

export function globalIdArg(
  prefixName: string,
  opts?: Omit<core.NexusArgConfig<"ID">, "type">
): core.NexusArgDef<any>;
export function globalIdArg(
  opts?: Omit<core.NexusArgConfig<"ID">, "type">
): core.NexusArgDef<any>;
export function globalIdArg(
  prefixNameOrOpts?: string | Omit<core.NexusArgConfig<"ID">, "type">,
  opts?: Omit<core.NexusArgConfig<"ID">, "type">
): core.NexusArgDef<any> {
  opts = typeof prefixNameOrOpts === "string" ? opts : prefixNameOrOpts ?? {};
  const prefixName =
    typeof prefixNameOrOpts === "string" ? prefixNameOrOpts : null;
  return core.arg({
    ...{
      [PREFIX_NAME]: prefixName,
    },
    type: "GID" as any,
    ...opts,
  });
}

const PREFIX_NAME = Symbol.for("PREFIX_NAME");

function isMaybeGlobalIdType(type: GraphQLInputType): boolean {
  if (isScalarType(type)) {
    return type.name === "GID";
  } else if (isNonNullType(type)) {
    return isMaybeGlobalIdType(type.ofType);
  }
  return false;
}

function isMaybeListOfMaybeGlobalIdType(type: GraphQLInputType): boolean {
  if (isListType(type)) {
    return isMaybeGlobalIdType(type.ofType);
  } else if (isNonNullType(type)) {
    return isMaybeListOfMaybeGlobalIdType(type.ofType);
  }
  return false;
}

function getPrefixName(arg: core.AllNexusArgsDefs): string {
  if (arg instanceof core.NexusNonNullDef) {
    return getPrefixName(arg.ofNexusType);
  } else if (arg instanceof core.NexusListDef) {
    return getPrefixName(arg.ofNexusType);
  } else if (arg instanceof core.NexusArgDef && arg.name === "GID") {
    return (arg.value as any)[PREFIX_NAME] as string;
  } else {
    throw new Error("Missing prefixName on globalIdArg options");
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
      const config = fieldConfig.extensions?.nexus?.config;
      return async function (root, args, ctx, info, next) {
        // decode any GID args
        const _args = mapValues(args ?? {}, (argValue, argName) => {
          const type = fieldConfig.args![argName as string].type;
          const argConfig = config.args[argName] as core.AllNexusArgsDefs;
          if (isMaybeGlobalIdType(type)) {
            return isDefined(argValue)
              ? fromGlobalId(argValue as string, getPrefixName(argConfig)).id
              : argValue;
          } else if (isMaybeListOfMaybeGlobalIdType(type)) {
            return isDefined(argValue)
              ? fromGlobalIds(
                  argValue as (string | null)[],
                  getPrefixName(argConfig)
                ).ids
              : argValue;
          }
          return argValue;
        });
        const result = await next(root, _args, ctx, info);
        return config.type === "GID"
          ? toGlobalId(config[PREFIX_NAME], result)
          : result;
      };
    },
    onInstall(b) {
      b.addType(
        core.scalarType({
          name: "GID",
          rootTyping: "number",
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
