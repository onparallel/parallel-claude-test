import {
  core,
  dynamicOutputMethod,
  intArg,
  objectType,
  plugin,
  stringArg,
} from "@nexus/schema";
import { GraphQLResolveInfo } from "graphql";
import { omit } from "remeda";

export type PaginationPluginConfig = {};

export type PaginationFieldConfig<
  TypeName extends string = any,
  FieldName extends string = any
> = {
  type: core.GetGen<"allOutputTypes", string> | core.AllNexusOutputTypeDefs;

  /**
   * Additional `search` argument that can be used for searching.
   */
  searchable?: boolean;
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
          typeDefinition: `<FieldName extends string>(
            fieldName: FieldName, 
            config: PaginationFieldConfig<TypeName, FieldName>
          ): void`,
          factory({
            typeName: parentTypeName,
            typeDef: t,
            args: factoryArgs,
            stage,
          }) {
            const [fieldName, fieldConfig] = factoryArgs as [
              string,
              PaginationFieldConfig
            ];
            const targetType = fieldConfig.type;

            const { paginationName } = getTypeNames(
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
function nonPaginationFieldProps(fieldConfig: PaginationFieldConfig) {
  return omit(fieldConfig, [
    "searchable",
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
  fieldConfig: PaginationFieldConfig
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

  return {
    targetTypeName,
    paginationName,
  };
};

function isPaginationFieldExtended(fieldConfig: PaginationFieldConfig) {
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
    throw new Error(
      `The ${info.parentType}.${info.fieldName} pagination field does not allow a negative "offset"`
    );
  }
  if (args.limit < 0) {
    throw new Error(
      `The ${info.parentType}.${info.fieldName} pagination field does not allow a negative "limit"`
    );
  }
}

// Provided for use if you create a custom implementation and want to call the original.
paginationPlugin.defaultValidateArgs = validateArgs;
