import { core, dynamicOutputMethod, plugin } from "@nexus/schema";
import { GraphQLResolveInfo } from "graphql";
import { omit } from "remeda";
import { fromGlobalId, fromGlobalIds, toGlobalId } from "../../util/globalId";

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

export type GlobalIdConfig = {
  prefixName?: string;
};

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
  const _opts =
    typeof prefixNameOrOpts === "string" ? opts : prefixNameOrOpts ?? {};
  const prefixName =
    typeof prefixNameOrOpts === "string" ? prefixNameOrOpts : null;
  return core.arg({
    ...{
      [PREFIX_NAME]: prefixName,
    },
    type: "GID" as any,
    ..._opts,
  });
}

const PREFIX_NAME = Symbol.for("PREFIX_NAME");

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
    onCreateFieldResolver({ fieldConfig, schemaExtension, ...a }) {
      const config = fieldConfig.extensions?.nexus?.config;
      return async function (root, args, ctx, info, next) {
        const _args =
          args &&
          Object.fromEntries(
            Object.entries(args).map(([argName, argValue]) => {
              const argConfig = config.args[argName].config;
              if (argConfig.type === "GID") {
                const isList = argConfig.list;
                const prefixName = argConfig[PREFIX_NAME] ?? config.type;
                return [
                  argName,
                  argValue &&
                    (isList
                      ? fromGlobalIds(argValue as string[], prefixName).ids
                      : fromGlobalId(argValue as string, prefixName).id),
                ];
              } else {
                return [argName, argValue];
              }
            })
          );

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
      return { types: [] };
    },
  });
}
