import ASCIIFolder from "fold-to-ascii";
import {
  arg,
  booleanArg,
  inputObjectType,
  list,
  nonNull,
  nullable,
  queryField,
  stringArg,
} from "nexus";
import { isDefined, sort, uniq } from "remeda";
import { fromGlobalIds, toGlobalId } from "../../util/globalId";
import { random } from "../../util/token";
import { authenticate, authenticateAnd, ifArgDefined, or } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { parseSortBy } from "../helpers/paginationPlugin";
import { validateAnd } from "../helpers/validateArgs";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { validIsDefined } from "../helpers/validators/validIsDefined";
import { validPath } from "../helpers/validators/validPath";
import {
  fieldsBelongsToPetition,
  petitionsArePublicTemplates,
  userHasAccessToPetitions,
} from "./authorizers";
import { validPetitionSharedWithFilter, validPetitionTagFilter } from "./types/filters";
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
          t.nullable.list.nonNull.field("status", { type: "PetitionStatus" });
          t.nullable.string("path");
          t.nullable.field("locale", { type: "PetitionLocale" });
          t.nullable.field("type", { type: "PetitionBaseType" });
          t.nullable.field("tags", { type: "PetitionTagFilter" });
          t.nullable.field("sharedWith", { type: "PetitionSharedWithFilter" });
          t.nullable.list.nonNull.field("signature", { type: "PetitionSignatureStatusFilter" });
          t.nullable.list.nonNull.globalId("fromTemplateId", { prefixName: "Petition" });
          t.nullable.list.nonNull.field("permissionTypes", { type: "PetitionPermissionType" });
        },
      }).asArg(),
      searchByNameOnly: booleanArg({
        description: "Search applies only on petition name",
      }),
      excludeAnonymized: booleanArg({
        description: "Exclude anonymized petitions from result",
      }),
    },
    searchable: true,
    sortableBy: [
      "createdAt",
      "sentAt",
      "name",
      "lastUsedAt",
      "lastActivityAt",
      "lastRecipientActivityAt",
    ] as any,
    validateArgs: validateAnd(
      validPetitionSharedWithFilter((args) => args.filters?.sharedWith, "filters.sharedWith"),
      validPetitionTagFilter((args) => args.filters?.tags, "filters.tags"),
      async (_, args, ctx, info) => {
        const fromTemplateId = args.filters?.fromTemplateId;
        if (isDefined(fromTemplateId)) {
          const hasAccess = await ctx.petitions.userHasAccessToPetitions(
            ctx.user!.id,
            fromTemplateId,
          );
          if (!hasAccess) {
            throw new ArgValidationError(info, "filters.fromTemplateId", "Invalid template ID");
          }
        }
      },
    ),
    resolve: async (
      _,
      { offset, limit, search, sortBy, filters, searchByNameOnly, excludeAnonymized },
      ctx,
    ) => {
      return ctx.petitions.getPaginatedPetitionsForUser(ctx.user!.org_id, ctx.user!.id, {
        search,
        offset,
        filters,
        sortBy: sortBy?.map((value) => {
          const [field, order] = parseSortBy(value);
          return { field: field, order };
        }),
        limit,
        searchByNameOnly: searchByNameOnly ?? false,
        excludeAnonymized: excludeAnonymized ?? false,
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
    ids: list(nonNull(globalIdArg("Petition"))),
    folders: "FoldersInput",
  },
  authorize: authenticateAnd(
    ifArgDefined(
      (args) => args.ids,
      or(userHasAccessToPetitions("ids" as never), petitionsArePublicTemplates("ids" as never)),
    ),
  ),
  validateArgs: validateAnd(
    validIsDefined((args) => args.ids ?? args.folders, "ids or folders"),
    notEmptyArray(
      (args) => ((args.ids ?? []) as any[]).concat(args.folders?.folderIds ?? []),
      "ids or folders",
    ),
  ),
  resolve: async (_, args, ctx) => {
    let petitionIds = args.ids ?? [];
    if (isDefined(args.folders)) {
      const folderIds = fromGlobalIds(args.folders.folderIds, "PetitionFolder", true).ids;
      const folderPetitions = await ctx.petitions.getUserPetitionsInsideFolders(
        folderIds,
        args.folders.type === "TEMPLATE",
        ctx.user!,
      );
      petitionIds.push(...folderPetitions.map((p) => p.id));
    }

    petitionIds = uniq(petitionIds);
    if (petitionIds.length === 0) {
      // nothing to return
      return [];
    }
    return await ctx.petitions.loadPetition(petitionIds);
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
    type: "PetitionBaseOrFolder",
    description: "The available templates",
    authorize: authenticate(),
    extendArgs: {
      path: stringArg(),
      locale: arg({ type: "PetitionLocale" }),
      isPublic: nonNull(booleanArg()),
      isOwner: booleanArg(),
      category: stringArg(),
    },
    searchable: true,
    resolve: (_, { limit, offset, path, locale, search, isPublic, isOwner, category }, ctx) => {
      if (isPublic) {
        return ctx.petitions.getPaginatedPublicTemplates({
          search,
          locale,
          limit,
          offset,
          categories: category ? [category] : null,
        });
      } else {
        const userId = ctx.user!.id;
        return ctx.petitions.getPaginatedPetitionsForUser(ctx.user!.org_id, userId, {
          search,
          limit,
          offset,
          sortBy: [{ field: "lastUsedAt", order: "desc" }],
          filters: {
            path,
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
    fieldsBelongsToPetition("petitionId", "petitionFieldId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
  },
  description: "A field of the petition.",
  resolve: async (_, args, ctx) => (await ctx.petitions.loadField(args.petitionFieldId))!,
});

export const petitionFolders = queryField("petitionFolders", {
  description: "Lists every path of the user's petitions as a string array",
  type: list("String"),
  authorize: authenticate(),
  args: {
    type: nonNull("PetitionBaseType"),
    currentPath: stringArg(),
  },
  validateArgs: validPath((args) => args.currentPath, "currentPath"),
  resolve: async (_, args, ctx) => {
    function pathAndParents(path: string): string[] {
      if (path.split("/").length > 2) {
        return [path, ...pathAndParents(path.replace(/^(.*\/).+$/, "$1"))];
      }
      return [path];
    }

    const petitionPaths = await ctx.petitions.getUserPetitionFoldersList(
      ctx.user!.id,
      ctx.user!.org_id,
      args.type === "TEMPLATE",
    );

    const fullPaths = uniq(
      [...petitionPaths, args.currentPath]
        .filter(isDefined)
        .flatMap((path) => pathAndParents(path))
        .filter((p) => p !== "/"),
    );
    return sort(fullPaths, (a, b) => a.localeCompare(b));
  },
});
