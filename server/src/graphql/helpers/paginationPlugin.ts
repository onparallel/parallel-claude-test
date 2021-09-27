import {
  arg,
  core,
  dynamicOutputMethod,
  enumType,
  intArg,
  list,
  nonNull,
  nullable,
  objectType,
  plugin,
  stringArg,
} from "nexus";
import { GraphQLResolveInfo } from "graphql";
import { omit } from "remeda";
import { KeysOfType } from "../../util/types";
import { ArgValidationError } from "./errors";

export function parseSortBy<T extends string>(
  key: T
): T extends `${infer U}_${"ASC" | "DESC"}` ? [U, "asc" | "desc"] : never {
  if (key.endsWith("_ASC")) {
    return [key.slice(0, -4), "asc"] as any;
  } else if (key.endsWith("_DESC")) {
    return [key.slice(0, -5), "desc"] as any;
  } else {
    throw new Error("This shouldn't happen as GraphQL validates the arguments");
  }
}

export type PaginationPluginConfig = {};

type ObjectOrInterfaceNames = core.GetGen<"objectNames"> | core.GetGen<"interfaceNames">;

type ObjectOrInterfaceTypeDef<TypeName extends string> =
  | core.NexusObjectTypeDef<TypeName>
  | core.NexusInterfaceTypeDef<TypeName>;

type SortableFieldTypes = string | number | Date | boolean | null | undefined;

export type PaginationFieldConfig<
  TypeName extends string,
  FieldName extends string,
  ItemType extends core.GetGen<"allOutputTypes"> | core.AllNexusOutputTypeDefs
> = {
  type: ItemType;

  /**
   * Additional `search` argument that can be used for searching.
   */
  searchable?: boolean;
  /**
   * Additional `search` argument that can be used for searching.
   * Only available for object and interface types
   */
  sortableBy?: ItemType extends ObjectOrInterfaceNames
    ? KeysOfType<core.GetGen2<"fieldTypes", ItemType>, SortableFieldTypes>[]
    : ItemType extends ObjectOrInterfaceTypeDef<infer TypeName>
    ? KeysOfType<core.GetGen2<"fieldTypes", TypeName>, SortableFieldTypes>[]
    : never;
  /**
   * Additional args to use for just this field
   */
  extendArgs?: core.ArgsRecord | ((args: core.ArgsRecord) => core.ArgsRecord);
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string;
  /**
   * Custom logic to validate the arguments.
   */
  validateArgs?: (args: Record<string, any>, info: GraphQLResolveInfo) => void;
  /**
   * Dynamically adds additional fields to the current "pagination" when it is defined.
   * This will cause the resulting type to be prefix'ed with the name of the type/field it is branched off of,
   * so as not to conflict with any non-extended paginations.
   */
  extendPagination?: (def: core.ObjectDefinitionBlock<any>) => void;
  /**
   * Allows removing totalCount from the output
   */
  hasTotalCount?: boolean;
  /**
   * Implement the full resolve, including `items` and `totalCount`.
   */
  resolve: (
    root: core.GetGen2<"rootTypes", TypeName>,
    args: core.ArgsValue<TypeName, FieldName>,
    ctx: core.GetGen<"context">,
    info: GraphQLResolveInfo
  ) =>
    | core.MaybePromise<core.ResultValue<TypeName, FieldName>>
    | core.MaybePromiseDeep<core.ResultValue<TypeName, FieldName>>;
} & NexusGenPluginFieldConfig<TypeName, FieldName>;

const PaginationArgs = {
  offset: nullable(
    intArg({
      description: "Number of elements to skip from the list.",
    })
  ),
  limit: nullable(
    intArg({
      description: "Number of elements to take from the list.",
    })
  ),
};

export function paginationPlugin() {
  // Define the plugin with the appropriate configuration.
  return plugin({
    name: "PaginationPlugin",
    fieldDefTypes: [
      core.printedGenTypingImport({
        module: "nexus",
        bindings: ["core"],
      }),
      core.printedGenTypingImport({
        module: "./helpers/paginationPlugin",
        bindings: ["PaginationFieldConfig"],
      }),
    ],
    // Defines the field added to the definition block:
    // t.paginationField("users", {
    //   type: "User"
    // })
    onInstall(b) {
      b.addType(
        dynamicOutputMethod({
          name: "paginationField",
          typeDefinition: `<
            FieldName extends string,
            PaginationType extends
              | core.GetGen<"allOutputTypes", string>
              | core.AllNexusOutputTypeDefs
          >(
            fieldName: FieldName, 
            config: PaginationFieldConfig<TypeName, FieldName, PaginationType>
          ): void`,
          factory({ typeName: parentTypeName, typeDef: t, args: factoryArgs, stage }) {
            const [fieldName, fieldConfig] = factoryArgs as [
              string,
              PaginationFieldConfig<any, any, any>
            ];
            const targetType = fieldConfig.type;

            const { paginationName, sortByName } = getTypeNames(
              fieldName,
              parentTypeName,
              fieldConfig
            );

            // Add the "Pagination" type to the schema if it doesn't exist already
            if (!b.hasType(paginationName)) {
              b.addType(
                objectType({
                  name: paginationName as any,
                  definition(t2) {
                    t2.nonNull.list.nonNull.field("items", {
                      type: targetType,
                      description: "The requested slice of items.",
                    });
                    if (!(fieldConfig.hasTotalCount === false)) {
                      t2.nonNull.int("totalCount", {
                        description: "The total count of items in the list.",
                      });
                    }
                    if (fieldConfig.extendPagination instanceof Function) {
                      fieldConfig.extendPagination(t2);
                    }
                  },
                })
              );
            }

            if (!b.hasType(sortByName) && fieldConfig.sortableBy) {
              b.addType(
                enumType({
                  name: sortByName,
                  description: `Order to use on ${parentTypeName}.${fieldName}`,
                  members: fieldConfig.sortableBy.flatMap((value) => [
                    `${value}_ASC`,
                    `${value}_DESC`,
                  ]),
                })
              );
            }

            // Add the field to the type.
            const args = {
              ...PaginationArgs,
              ...(fieldConfig.searchable
                ? {
                    search: stringArg({
                      description: "Optional text to search in the collection.",
                    }),
                  }
                : {}),
              ...(fieldConfig.sortableBy
                ? {
                    sortBy: nullable(
                      list(
                        nonNull(
                          arg({
                            description: "Sorting to use on the collection",
                            type: sortByName as any,
                          })
                        )
                      )
                    ),
                  }
                : {}),
            };
            t.field(fieldName, {
              ...nonPaginationFieldProps(fieldConfig),
              args:
                typeof fieldConfig.extendArgs === "function"
                  ? fieldConfig.extendArgs(args)
                  : typeof fieldConfig.extendArgs === "object"
                  ? { ...args, ...(fieldConfig.extendArgs ?? {}) }
                  : args,
              type: paginationName as any,
              resolve(root, args, ctx, info) {
                validateArgs(args, info);
                return fieldConfig.resolve(root, args, ctx, info);
              },
            });
          },
        })
      );
    },
  });
}

// Extract all of the non-pagination related field config we may want to apply for plugin purposes
function nonPaginationFieldProps(fieldConfig: PaginationFieldConfig<any, any, any>) {
  return omit(fieldConfig, [
    "searchable",
    "sortableBy",
    "extendArgs",
    "extendPagination",
    "resolve",
    "type",
    "validateArgs",
  ]);
}

const getTypeNames = (
  fieldName: string,
  parentTypeName: string,
  fieldConfig: PaginationFieldConfig<any, any, any>
) => {
  const targetTypeName =
    typeof fieldConfig.type === "string" ? fieldConfig.type : (fieldConfig.type.name as string);

  // If we have changed the config specific to this field, on the pagination,
  // then we need a custom type for the pagination.
  const paginationName = isPaginationFieldExtended(fieldConfig)
    ? `${parentTypeName}${upperFirst(fieldName)}_Pagination`
    : `${targetTypeName}Pagination`;
  const sortByName = `${parentTypeName}${upperFirst(fieldName)}_OrderBy`;

  return {
    targetTypeName,
    paginationName,
    sortByName,
  };
};

function isPaginationFieldExtended(fieldConfig: PaginationFieldConfig<any, any, any>) {
  return Boolean(fieldConfig.extendPagination);
}

const upperFirst = (fieldName: string) => {
  return fieldName.slice(0, 1).toUpperCase().concat(fieldName.slice(1));
};

function validateArgs(args: Record<string, any> = {}, info: GraphQLResolveInfo) {
  if (args.offset < 0) {
    throw new ArgValidationError(info, "offset", "Value can't be negative.");
  }
  if (args.limit < 0) {
    throw new ArgValidationError(info, "limit", "Value can't be negative.");
  }
}

// Provided for use if you create a custom implementation and want to call the original.
paginationPlugin.defaultValidateArgs = validateArgs;
