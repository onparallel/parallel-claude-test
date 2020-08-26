import {
  arg,
  core,
  dynamicOutputMethod,
  enumType,
  intArg,
  objectType,
  plugin,
  stringArg,
} from "@nexus/schema";
import { GraphQLResolveInfo } from "graphql";
import { omit } from "remeda";
import { KeysOfType } from "../../util/types";
import { ArgValidationError } from "./errors";

export type PaginationPluginConfig = {};

type a = core.GetGen2<"fieldTypes", "PetitionBase">;

type GetObjectType<
  Type extends
    | core.GetGen<"objectNames">
    | core.GetGen<"interfaceNames">
    | core.AllNexusOutputTypeDefs
> = Type extends core.GetGen<"objectNames"> | core.GetGen<"interfaceNames">
  ? core.GetGen2<"fieldTypes", Type>
  : Type extends core.NexusObjectTypeDef<infer TypeName>
  ? core.GetGen2<"fieldTypes", TypeName>
  : never;

export type PaginationFieldConfig<
  TypeName extends string,
  FieldName extends string,
  ItemType extends
    | core.GetGen<"allOutputTypes", string>
    | core.AllNexusOutputTypeDefs
> = {
  type: ItemType;

  /**
   * Additional `search` argument that can be used for searching.
   */
  searchable?: boolean;
  /**
   * Additional `search` argument that can be used for searching.
   */
  sortableBy?: KeysOfType<
    GetObjectType<ItemType>,
    string | number | Date | boolean | null | undefined
  >[];
  /**
   * Additional args to use for just this field
   */
  additionalArgs?: core.ArgsRecord;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
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
   * Implement the full resolve, including `items` and `totalCount`.
   */
  resolve: (
    root: core.RootValue<TypeName>,
    args: core.ArgsValue<TypeName, FieldName>,
    ctx: core.GetGen<"context">,
    info: GraphQLResolveInfo
  ) =>
    | core.MaybePromise<core.ResultValue<TypeName, FieldName>>
    | core.MaybePromiseDeep<core.ResultValue<TypeName, FieldName>>;
} & NexusGenPluginFieldConfig<TypeName, FieldName>;

const PaginationArgs = {
  offset: intArg({
    nullable: true,
    description: "Number of elements to skip from the list.",
  }),
  limit: intArg({
    nullable: true,
    description: "Number of elements to take from the list.",
  }),
};

export function paginationPlugin() {
  // Define the plugin with the appropriate configuration.
  return plugin({
    name: "PaginationPlugin",
    fieldDefTypes: [
      core.printedGenTypingImport({
        module: "@nexus/schema",
        bindings: ["core"],
      }),
      core.printedGenTypingImport({
        module: "./helpers/paginationPlugin",
        bindings: ["PaginationFieldConfig"],
      }),
    ],
    // Defines the field added to the definition block:
    // t.paginationField('users', {
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
          factory({
            typeName: parentTypeName,
            typeDef: t,
            args: factoryArgs,
            stage,
          }) {
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
                    t2.field("items", {
                      type: targetType,
                      description: "The requested slice of items.",
                      list: [true],
                    });
                    t2.int("totalCount", {
                      nullable: false,
                      description: "The total count of items in the list.",
                    });
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
            t.field(fieldName, {
              ...nonPaginationFieldProps(fieldConfig),
              args: {
                ...PaginationArgs,
                ...(fieldConfig.searchable
                  ? {
                      search: stringArg({
                        description:
                          "Optional text to search in the collection.",
                      }),
                    }
                  : {}),
                ...(fieldConfig.sortableBy
                  ? {
                      sortBy: arg({
                        description: "Sorting to use on the collection",
                        required: false,
                        type: sortByName as any,
                        list: [true],
                      }),
                    }
                  : {}),
                ...(fieldConfig.additionalArgs ?? {}),
              },
              type: paginationName as any,
              resolve(root, args, ctx, info) {
                validateArgs(args, info);
                return fieldConfig.resolve(root, args, ctx, info);
              },
            });
          },
        })
      );

      return { types: [] };
    },
  });
}

// Extract all of the non-pagination related field config we may want to apply for plugin purposes
function nonPaginationFieldProps(
  fieldConfig: PaginationFieldConfig<any, any, any>
) {
  return omit(fieldConfig, [
    "searchable",
    "sortableBy",
    "additionalArgs",
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
    typeof fieldConfig.type === "string"
      ? fieldConfig.type
      : (fieldConfig.type.name as string);

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

function isPaginationFieldExtended(
  fieldConfig: PaginationFieldConfig<any, any, any>
) {
  return Boolean(fieldConfig.extendPagination);
}

const upperFirst = (fieldName: string) => {
  return fieldName.slice(0, 1).toUpperCase().concat(fieldName.slice(1));
};

function validateArgs(
  args: Record<string, any> = {},
  info: GraphQLResolveInfo
) {
  if (args.offset < 0) {
    throw new ArgValidationError(info, "offset", "Value can't be negative.");
  }
  if (args.limit < 0) {
    throw new ArgValidationError(info, "limit", "Value can't be negative.");
  }
}

// Provided for use if you create a custom implementation and want to call the original.
paginationPlugin.defaultValidateArgs = validateArgs;
