import {
  arg,
  nonNull,
  list,
  objectType,
  queryField,
  stringArg,
} from "@nexus/schema";
import { PetitionLocale } from "../../api/public/__types";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { isDefined } from "../../util/remedaExtensions";
import { safeJsonParse } from "../../util/safeJsonParse";
import { toHtml } from "../../util/slate";

export const LandingTemplate = objectType({
  name: "LandingTemplate",
  description: "A public template on landing page",
  rootTyping: "db.Petition",
  definition(t) {
    t.globalId("id", { prefixName: "Petition" });
    t.nullable.string("name", { resolve: (o) => o.name });
    t.nullable.string("descriptionHtml", {
      resolve: (o) => {
        return o.template_description
          ? toHtml(safeJsonParse(o.template_description))
          : null;
      },
    });
    t.string("slug", {
      resolve: (o) => o.public_metadata.slug || toGlobalId("Petition", o.id),
    });
    t.field("locale", {
      type: "PetitionLocale",
      resolve: (o) => o.locale as PetitionLocale,
    });
    t.nullable.string("shortDescription", {
      resolve: (o) => o.public_metadata.description,
    });
    t.nullable.string("backgroundColor", {
      resolve: (o) => o.public_metadata.background_color,
    });
    t.nullable.list.nonNull.string("categories", {
      resolve: (o) => o.public_metadata.categories,
    });
    t.string("ownerFullName", {
      resolve: async (root, _, ctx) => {
        const owner = (await ctx.petitions.loadPetitionOwner(root.id))!;
        return fullName(owner.first_name, owner.last_name);
      },
    });
    t.nullable.string("ownerAvatarUrl", {
      resolve: async (o, _, ctx) => {
        const owner = (await ctx.petitions.loadPetitionOwner(o.id))!;
        return ctx.users.loadAvatarUrl(owner.id);
      },
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
    t.datetime("updatedAt", { resolve: (o) => o.updated_at });
    t.nullable.string("imageUrl", {
      resolve: async (o, _, ctx) => {
        if (o.public_metadata.image_public_file_id) {
          const file = await ctx.files.loadPublicFile(
            o.public_metadata.image_public_file_id
          );
          return `${ctx.config.misc.uploadsUrl}/${file!.path}`;
        }
        return null;
      },
    });
  },
});

export const landingQueries = queryField((t) => {
  t.paginationField("landingTemplates", {
    type: "LandingTemplate",
    extendArgs: {
      categories: list(nonNull(stringArg())),
      locale: nonNull(arg({ type: "PetitionLocale" })),
    },
    resolve: async (_, { offset, limit, locale, categories }, ctx) => {
      return await ctx.petitions.loadPublicTemplates({
        limit,
        offset,
        locale,
        categories,
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
            if (limit === 0) {
              return [];
            }
            return await ctx.petitions.loadPublicTemplates({
              limit,
              offset,
              locale,
              categories: [category],
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
