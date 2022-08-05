import { ApolloError } from "apollo-server-core";
import ASCIIFolder from "fold-to-ascii";
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
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { random } from "../../util/token";
import { authenticate, authenticateAnd, or } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { parseSortBy } from "../helpers/paginationPlugin";
import {
  fieldsBelongsToPetition,
  petitionsArePublicTemplates,
  userHasAccessToPetitions,
} from "./authorizers";
import { validatePublicPetitionLinkSlug } from "./validations";

export const petitionsQuery = queryField((t) => {
  t.paginationField("petitions", {
    type: "PetitionBaseOrFolder",
    description: "The petitions of the user",
    authorize: authenticate(),
    extendArgs: {
      filters: inputObjectType({
        name: "PetitionFilter",
        definition(t) {
          t.nullable.list.nonNull.field("status", {
            type: "PetitionStatus",
          });
          t.nullable.string("path");
          t.nullable.field("locale", {
            type: "PetitionLocale",
          });
          t.nullable.field("type", {
            type: "PetitionBaseType",
          });
          t.nullable.list.nonNull.globalId("tagIds", { prefixName: "Tag" });
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
    sortableBy: ["createdAt", "sentAt", "name", "lastUsedAt"] as any,
    resolve: async (_, { offset, limit, search, sortBy, filters }, ctx) => {
      // move this to validator if it grows in complexity
      if (filters?.tagIds) {
        if (filters.tagIds.length > 10) {
          throw new ApolloError("Invalid filter", "INVALID_FILTER");
        }
        const tags = await ctx.tags.loadTag(filters.tagIds);
        if (!tags.every((tag) => tag?.organization_id === ctx.user!.org_id)) {
          throw new ApolloError("Invalid filter", "INVALID_FILTER");
        }
      }

      if (
        filters?.sharedWith &&
        filters.sharedWith.filters.some((f) => {
          const type = fromGlobalId(f.value).type;
          return type !== "User" && type !== "UserGroup";
        })
      ) {
        throw new ApolloError("Invalid filter", "INVALID_FILTER");
      }

      return await ctx.petitions.loadPetitionsForUser(ctx.user!.id, {
        search,
        offset,
        filters,
        sortBy: sortBy?.map((value) => {
          const [field, order] = parseSortBy(value);
          return { field: field, order };
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
          sortBy: [{ field: "lastUsedAt", order: "desc" }],
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

export const getSlugForPublicPetitionLink = queryField("getSlugForPublicPetitionLink", {
  type: "String",
  args: {
    petitionName: nullable(stringArg()),
  },
  authorize: authenticate(),
  resolve: async (_, { petitionName }, ctx) => {
    const randomSlug = () => "".padEnd(8, random(8).toLowerCase()); // random string of 8 chars long

    let slug = petitionName
      ? ASCIIFolder.foldReplacing(petitionName.trim().toLowerCase()) // replace all non ASCII chars with their ASCII equivalent
          .replace(/\s/g, "-") // replace spaces with dashes
          .replace(/[^a-z0-9-]/g, "") // remove all invalid chars
          .padEnd(8, random(8).toLowerCase()) // fill with random chars to ensure min length
          .slice(0, 30) // max 30 chars
      : randomSlug();

    let publicLink = await ctx.petitions.loadPublicPetitionLinkBySlug(slug);
    // loop until we get a slug that is not taken
    while (publicLink) {
      slug += randomSlug();
      if (slug.length > 30) {
        // if slug reaches max length, set to random to ensure it is still valid
        slug = randomSlug();
      }
      publicLink = await ctx.petitions.loadPublicPetitionLinkBySlug(slug);
    }

    return slug;
  },
});

export const isValidPublicPetitionLinkSlug = queryField("isValidPublicPetitionLinkSlug", {
  type: "Boolean",
  args: {
    slug: nonNull(stringArg()),
  },
  authorize: authenticate(),
  validateArgs: validatePublicPetitionLinkSlug((args) => args.slug, "slug"),
  resolve: () => true,
});

export const petitionFieldQuery = queryField("petitionField", {
  type: "PetitionField",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "petitionFieldId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
  },
  description: "A field of the petition.",
  resolve: async (_, args, ctx) => (await ctx.petitions.loadField(args.petitionFieldId))!,
});
