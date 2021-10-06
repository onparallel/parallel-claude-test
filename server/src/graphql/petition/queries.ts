import {
  arg,
  booleanArg,
  enumType,
  inputObjectType,
  list,
  nonNull,
  nullable,
  queryField,
  stringArg,
} from "nexus";
import { decode } from "jsonwebtoken";
import { toGlobalId, fromGlobalId, fromGlobalIds } from "../../util/globalId";
import { authenticate, authenticateAnd, or } from "../helpers/authorize";
import { WhitelistedError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { parseSortBy } from "../helpers/paginationPlugin";
import { petitionsArePublicTemplates, userHasAccessToPetitions } from "./authorizers";
import { validateAuthTokenPayload } from "./validations";
import { isDefined } from "remeda";

export const petitionsQuery = queryField((t) => {
  t.paginationField("petitions", {
    type: "PetitionBase",
    description: "The petitions of the user",
    authorize: authenticate(),
    extendArgs: {
      filters: inputObjectType({
        name: "PetitionFilter",
        definition(t) {
          t.nullable.list.nonNull.field("status", {
            type: "PetitionStatus",
          });
          t.nullable.field("locale", {
            type: "PetitionLocale",
          });
          t.nullable.field("type", {
            type: "PetitionBaseType",
          });
          t.nullable.list.nonNull.id("tagIds");
          t.nullable.field("sharedWith", {
            type: inputObjectType({
              name: "PetitionSharedWithFilter",
              definition(t) {
                t.nonNull.field("operator", {
                  type: enumType({
                    name: "FilterSharedWithLogicalOperator",
                    members: ["AND", "OR"],
                  }),
                });
                t.nonNull.list.nonNull.field("filters", {
                  type: inputObjectType({
                    name: "PetitionSharedWithFilterLine",
                    definition(t) {
                      t.nonNull.id("value");
                      t.nonNull.field("operator", {
                        type: enumType({
                          name: "FilterSharedWithOperator",
                          members: ["SHARED_WITH", "NOT_SHARED_WITH", "IS_OWNER", "NOT_IS_OWNER"],
                        }),
                      });
                    },
                  }),
                });
              },
            }),
          });
        },
      }).asArg(),
    },
    searchable: true,
    sortableBy: ["createdAt", "sentAt", "name", "lastUsedAt" as any],
    resolve: async (_, { offset, limit, search, sortBy, filters }, ctx) => {
      // move this to validator if it grows in complexity
      if (filters?.tagIds) {
        if (filters.tagIds.length > 10) {
          throw new WhitelistedError("Invalid filter", "INVALID_FILTER");
        }
        const tagIds = fromGlobalIds(filters.tagIds, "Tag").ids;
        if (tagIds.some((id) => !isDefined(id))) {
          throw new WhitelistedError("Invalid filter", "INVALID_FILTER");
        }
        const tags = await ctx.tags.loadTag(tagIds);
        if (!tags.every((tag) => tag?.organization_id === ctx.user!.org_id)) {
          throw new WhitelistedError("Invalid filter", "INVALID_FILTER");
        }
      }

      if (
        filters?.sharedWith &&
        filters.sharedWith.filters.some((f) => {
          const type = fromGlobalId(f.value).type;
          return type !== "User" && type !== "UserGroup";
        })
      ) {
        throw new WhitelistedError("Invalid filter", "INVALID_FILTER");
      }

      const columnMap = {
        createdAt: "created_at",
        sentAt: "sent_at",
        name: "name",
        lastUsedAt: "last_used_at",
      } as const;
      return await ctx.petitions.loadPetitionsForUser(ctx.user!.id, {
        search,
        offset,
        filters,
        sortBy: sortBy?.map((value) => {
          const [field, order] = parseSortBy(value);
          return { column: columnMap[field], order };
        }),
        limit,
      });
    },
  });
});

export const petitionQuery = queryField("petition", {
  type: nullable("PetitionBase"),
  args: {
    id: nonNull(globalIdArg("Petition")),
  },
  authorize: authenticateAnd(or(userHasAccessToPetitions("id"), petitionsArePublicTemplates("id"))),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.loadPetition(args.id);
  },
});

export const petitionsByIdQuery = queryField("petitionsById", {
  type: list(nullable("PetitionBase")),
  args: {
    ids: nonNull(list(nonNull(globalIdArg("Petition")))),
  },
  authorize: authenticateAnd(
    or(userHasAccessToPetitions("ids"), petitionsArePublicTemplates("ids"))
  ),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.loadPetition(args.ids);
  },
});

export const publicTemplateCategoriesQuery = queryField((t) => {
  t.list.string("publicTemplateCategories", {
    authorize: authenticate(),
    resolve: async (root, _, ctx) => {
      return await ctx.petitions.getPublicTemplatesCategories();
    },
  });
});

export const templatesQuery = queryField((t) => {
  t.paginationField("templates", {
    type: "PetitionTemplate",
    description: "The available templates",
    authorize: authenticate(),
    extendArgs: {
      locale: arg({ type: "PetitionLocale" }),
      isPublic: nonNull(booleanArg()),
      isOwner: booleanArg(),
      category: stringArg(),
    },
    searchable: true,
    resolve: async (_, { limit, offset, locale, search, isPublic, isOwner, category }, ctx) => {
      if (isPublic) {
        return await ctx.petitions.loadPublicTemplates({
          search,
          locale,
          limit,
          offset,
          categories: category ? [category] : null,
        });
      } else {
        const userId = ctx.user!.id;
        return await ctx.petitions.loadPetitionsForUser(userId, {
          search,
          limit,
          offset,
          sortBy: [{ column: "last_used_at", order: "desc" }],
          filters: {
            type: "TEMPLATE",
            locale,
            sharedWith:
              isOwner === true
                ? {
                    operator: "AND",
                    filters: [{ operator: "IS_OWNER", value: toGlobalId("User", userId) }],
                  }
                : isOwner === false
                ? {
                    operator: "AND",
                    filters: [{ operator: "NOT_IS_OWNER", value: toGlobalId("User", userId) }],
                  }
                : null,
          },
        });
      }
    },
  });
});

export const petitionAuthToken = queryField("petitionAuthToken", {
  type: nullable("Petition"),
  args: {
    token: nonNull(stringArg()),
  },
  authorize: (_, { token }, ctx) => ctx.security.verifyAuthToken(token),
  validateArgs: validateAuthTokenPayload((args) => args.token, "petitionId", "token"),
  resolve: async (_, { token }, ctx) => {
    const payload: any = decode(token);
    return await ctx.petitions.loadPetition(payload.petitionId);
  },
});
