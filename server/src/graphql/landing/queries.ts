import {
  list,
  nonNull,
  nullable,
  objectType,
  queryField,
  stringArg,
} from "@nexus/schema";

export const PublicTemplateMetadata = objectType({
  name: "PublicTemplateMetadata",
  description: "The metadata of a public template",
  definition(t) {
    t.id("slug");
    t.nullable.string("description");
    t.nullable.string("backgroundColor", {
      description: "background color for the template card in #HEX format",
    });
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
    t.nonNull.list.nonNull.string("categories", {
      resolve: (o) => o.public_categories ?? [],
    });
  },
});

export const publicTemplates = queryField((t) => {
  t.paginationField("landingPublicTemplates", {
    type: "PublicTemplate",
    extendArgs: {
      categories: nullable(list(nonNull(stringArg()))),
    },
    resolve: async (_, { offset, limit, categories }, ctx) => {
      return await ctx.petitions.loadPublicTemplates({
        limit,
        offset,
        categories,
      });
    },
  });
});
