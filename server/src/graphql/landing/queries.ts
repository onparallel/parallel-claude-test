import { arg, nonNull, objectType, queryField, stringArg } from "@nexus/schema";

export const PublicTemplateMetadata = objectType({
  name: "PublicTemplateMetadata",
  description: "The metadata of a public template",
  rootTyping: `{
    slug?: string;
    description?: string;
    backgroundColor?: string;
    categories?: string[];
  }`,
  definition(t) {
    t.id("slug");
    t.nullable.string("description");
    t.nullable.string("backgroundColor", {
      description: "background color for the template card in #HEX format",
    });
    t.nullable.list.nonNull.string("categories");
  },
});

export const PublicTemplate = objectType({
  name: "PublicTemplate",
  description: "A public template",
  rootTyping: "db.Petition",
  definition(t) {
    t.implements("PetitionBase");
    t.field("metadata", {
      type: "PublicTemplateMetadata",
      resolve: (o) => o.public_metadata ?? {},
    });
  },
});

export const landingPublicTemplates = queryField((t) => {
  t.paginationField("landingPublicTemplates", {
    type: "PublicTemplate",
    extendArgs: {
      category: nonNull(stringArg()),
      locale: nonNull(arg({ type: "PetitionLocale" })),
    },
    resolve: async (_, { offset, limit, locale, category }, ctx) => {
      return await ctx.petitions.loadPublicTemplates({
        limit,
        offset,
        locale,
        category,
      });
    },
  });

  t.nullable.field("landingPublicTemplateBySlug", {
    type: "PublicTemplate",
    args: { slug: nonNull(stringArg()) },
    resolve: async (_, { slug }, ctx) => {
      return await ctx.petitions.loadPublicTemplateBySlug(slug);
    },
  });
});

export const landingPublicTemplatesSamples = queryField((t) => {
  t.list.field("landingPublicTemplatesSamples", {
    type: objectType({
      name: "PublicTemplateSample",
      rootTyping: "string",
      definition(t) {
        t.nonNull.string("category", {
          resolve: (category) => category,
        });
        t.paginationField("templates", {
          type: "PublicTemplate",
          extendArgs: {
            locale: nonNull(arg({ type: "PetitionLocale" })),
          },
          resolve: async (category, { limit, offset, locale }, ctx) => {
            return await ctx.petitions.loadPublicTemplates({
              limit,
              offset,
              locale,
              category,
              sortBy: "used_count",
            });
          },
        });
      },
    }),
    resolve: async (o, _, ctx) => {
      return await ctx.petitions.getPublicTemplatesCategories();
    },
  });
});
