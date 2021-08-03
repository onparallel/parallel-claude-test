import { arg, nonNull, objectType, queryField, stringArg } from "@nexus/schema";
import { fullName } from "../../util/fullName";
import { isDefined } from "../../util/remedaExtensions";
import { safeJsonParse } from "../../util/safeJsonParse";
import { toHtml } from "../../util/slate";

export const LandingTemplate = objectType({
  name: "LandingTemplate",
  description: "A public template on landing page",
  rootTyping: "db.Petition",
  definition(t) {
    t.globalId("id");
    t.nullable.string("name", { resolve: (o) => o.name });
    t.nullable.string("descriptionHtml", {
      resolve: (o) => {
        return o.template_description
          ? toHtml(safeJsonParse(o.template_description))
          : null;
      },
    });
    t.string("slug", { resolve: (o) => o.public_metadata.slug });
    t.nullable.string("shortDescription", {
      resolve: (o) => o.public_metadata.description,
    });
    t.nullable.string("backgroundColor", {
      resolve: (o) => o.public_metadata.backgroundColor,
    });
    t.nullable.list.nonNull.string("categories", {
      resolve: (o) => o.public_metadata.categories,
    });
    t.globalId("ownerId", {
      prefixName: "User",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadPetitionOwner(root.id))!.id;
      },
    });
    t.string("ownerFullName", {
      resolve: async (root, _, ctx) => {
        const owner = (await ctx.petitions.loadPetitionOwner(root.id))!;
        return fullName(owner.first_name, owner.last_name);
      },
    });
    t.globalId("organizationId", {
      prefixName: "Organization",
      resolve: (o) => o.org_id,
    });
    t.string("organizationName", {
      resolve: async (o, _, ctx) => {
        const org = (await ctx.organizations.loadOrg(o.org_id))!;
        return org.name;
      },
    });
    t.int("fieldCount", {
      resolve: async (o, _, ctx) => {
        return await ctx.petitions.loadFieldCountForPetition(o.id);
      },
    });
    t.boolean("hasConditionals", {
      resolve: async (o, _, ctx) => {
        const fields = await ctx.petitions.loadFieldsForPetition(o.id);
        return fields.some((f) => isDefined(f.visibility));
      },
    });
  },
});

export const landingQueries = queryField((t) => {
  t.paginationField("landingTemplates", {
    type: "LandingTemplate",
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

  t.nullable.field("landingTemplateBySlug", {
    type: "LandingTemplate",
    args: { slug: nonNull(stringArg()) },
    resolve: async (_, { slug }, ctx) => {
      return await ctx.petitions.loadPublicTemplateBySlug(slug);
    },
  });

  t.list.field("landingTemplatesSamples", {
    type: objectType({
      name: "LandingTemplateSample",
      rootTyping: "string",
      definition(t) {
        t.nonNull.string("category", {
          resolve: (category) => category,
        });
        t.paginationField("templates", {
          type: "LandingTemplate",
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
