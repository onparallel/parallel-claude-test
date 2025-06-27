import ASCIIFolder from "fold-to-ascii";
import {
  arg,
  booleanArg,
  inputObjectType,
  list,
  nonNull,
  nullable,
  objectType,
  queryField,
  stringArg,
} from "nexus";
import { isNonNullish, sort, unique, zip } from "remeda";
import { assert } from "ts-essentials";
import { PetitionFieldOptions } from "../../services/PetitionFieldService";
import { fromGlobalIds, toGlobalId } from "../../util/globalId";
import { random } from "../../util/token";
import {
  and,
  authenticate,
  authenticateAnd,
  ifArgDefined,
  ifArgEquals,
  not,
  or,
} from "../helpers/authorize";
import { ArgValidationError, ForbiddenError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { mapPetitionFilterInput } from "../helpers/mapPetitionFilterInput";
import { parseSortBy } from "../helpers/paginationPlugin";
import { validateAnd } from "../helpers/validateArgs";
import { validPath } from "../helpers/validators/validPath";
import { contextUserHasPermission } from "../users/authorizers";
import {
  fieldHasType,
  fieldsBelongsToPetition,
  petitionHasStatus,
  petitionIsNotAnonymized,
  petitionsArePublicTemplates,
  userHasAccessToPetitions,
  userHasFeatureFlag,
} from "./authorizers";
import {
  validApprovalsFilter,
  validPetitionSharedWithFilter,
  validPetitionTagFilter,
} from "./types/filters";
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
          t.nullable.list.nonNull.field("permissionTypes", {
            type: "PetitionPermissionType",
            deprecation: "NOT USED",
          });
          t.nullable.field("approvals", { type: "PetitionApprovalsFilterInput" });
        },
      }).asArg(),
      searchByNameOnly: booleanArg({
        description: "Search applies only on petition name",
      }),
      minEffectivePermission: arg({ type: "PetitionPermissionType" }),
      excludeAnonymized: booleanArg({
        description: "Exclude anonymized petitions from result",
      }),
      excludePublicTemplates: booleanArg({
        description: "Exclude public templates from result",
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
      validPetitionSharedWithFilter("filters.sharedWith"),
      validPetitionTagFilter("filters.tags"),
      validApprovalsFilter("filters.approvals"),
      async (_, args, ctx, info) => {
        const fromTemplateId = args.filters?.fromTemplateId;
        if (isNonNullish(fromTemplateId)) {
          // just check that the templates belong to same org as user
          // as users can filter by templateIds without having permissions on them
          const petitions = await ctx.petitions.loadPetition(fromTemplateId);
          if (!petitions.every((p) => p && p.is_template && p.org_id === ctx.user!.org_id)) {
            throw new ArgValidationError(info, "filters.fromTemplateId", "Invalid template ID");
          }
        }
      },
    ),
    resolve: async (
      _,
      {
        offset,
        limit,
        search,
        sortBy,
        filters,
        searchByNameOnly,
        excludeAnonymized,
        excludePublicTemplates,
        minEffectivePermission,
      },
      ctx,
    ) => {
      if (isNonNullish(limit) && limit > 100) {
        ctx.logger.info(`User:${ctx.user!.id} from Org:${ctx.user!.org_id} using limit ${limit}`);
      }
      return ctx.petitions.getPaginatedPetitionsForUser({
        orgId: ctx.user!.org_id,
        userId: ctx.user!.id,
        opts: {
          search,
          offset,
          filters: filters ? mapPetitionFilterInput(filters) : undefined,
          sortBy: sortBy?.map((value) => {
            const [field, order] = parseSortBy(value);
            return { field: field, order };
          }),
          limit,
          minEffectivePermission,
          searchByNameOnly: searchByNameOnly ?? false,
          excludeAnonymized: excludeAnonymized ?? false,
          excludePublicTemplates: excludePublicTemplates ?? false,
        },
      });
    },
  });
});

export const petitionQuery = queryField("petition", {
  type: nullable("PetitionBase"),
  args: {
    id: nonNull(globalIdArg("Petition")),
  },
  authorize: authenticateAnd(
    or(
      userHasAccessToPetitions("id"),
      and(
        petitionsArePublicTemplates("id" as never),
        contextUserHasPermission("PETITIONS:LIST_PUBLIC_TEMPLATES"),
      ),
    ),
  ),
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
      or(
        userHasAccessToPetitions("ids" as never),
        and(
          petitionsArePublicTemplates("ids" as never),
          contextUserHasPermission("PETITIONS:LIST_PUBLIC_TEMPLATES"),
        ),
      ),
    ),
  ),
  validateArgs: (_, args, ctx, info) => {
    if ((args.ids?.length ?? 0) + (args.folders?.folderIds?.length ?? 0) === 0) {
      throw new ArgValidationError(
        info,
        "ids or folders",
        `Expected ids or folders.folderIds to be defined and not empty`,
      );
    }
  },
  resolve: async (_, args, ctx) => {
    let petitionIds = args.ids ?? [];
    if (isNonNullish(args.folders)) {
      const folderIds = fromGlobalIds(args.folders.folderIds, "PetitionFolder", true).ids;
      const folderPetitions = await ctx.petitions.getUserPetitionsInsideFolders(
        folderIds,
        args.folders.type === "TEMPLATE",
        ctx.user!,
      );
      petitionIds.push(...folderPetitions.map((p) => p.id));
    }

    petitionIds = unique(petitionIds);
    if (petitionIds.length === 0) {
      // nothing to return
      return [];
    }
    return await ctx.petitions.loadPetition(petitionIds);
  },
});

export const petitionsSharingInfoQuery = queryField("petitionsSharingInfo", {
  type: objectType({
    name: "PetitionSharingInfo",
    definition(t) {
      t.nonNull.int("totalCount", {
        resolve: (ids) => ids.length,
      });
      t.nonNull.int("ownedCount", {
        resolve: async (ids, _, ctx) => {
          const permissions = (
            await ctx.petitions.loadEffectivePermissions(ids as number[])
          ).flat();
          return permissions.filter((p) => p.user_id === ctx.user!.id && p.type === "OWNER").length;
        },
      });
      t.nonNull.list.nonNull.globalId("ownedOrWriteIds", {
        prefixName: "Petition",
        resolve: async (ids, _, ctx) => {
          const permissions = (
            await ctx.petitions.loadEffectivePermissions(ids as number[])
          ).flat();
          return permissions
            .filter((p) => p.user_id === ctx.user!.id && ["OWNER", "WRITE"].includes(p.type))
            .map((p) => p.petition_id);
        },
      });
      t.nonNull.list.nonNull.field("readPetitions", {
        type: "PetitionBase",
        resolve: async (ids, _, ctx) => {
          const permissions = (
            await ctx.petitions.loadEffectivePermissions(ids as number[])
          ).flat();
          const petitionIds = permissions
            .filter((p) => p.user_id === ctx.user!.id && p.type === "READ")
            .map((p) => p.petition_id);

          return await ctx.petitions.loadPetition(petitionIds);
        },
      });
      t.nonNull.list.nonNull.field("firstPetitionPermissions", {
        type: "PetitionPermission",
        resolve: async ([id], _, ctx) => {
          return await ctx.petitions.loadUserAndUserGroupPermissionsByPetitionId(id);
        },
      });
      t.nonNull.list.nonNull.field("firstPetitionEffectivePermissions", {
        type: "EffectivePetitionUserPermission",
        description: "The effective permissions on the petition",
        resolve: async ([id], _, ctx) => {
          return await ctx.petitions.loadEffectivePermissions(id);
        },
      });
    },
    sourceType: "number[]",
  }),
  args: {
    ids: list(nonNull(globalIdArg("Petition"))),
    folders: "FoldersInput",
  },
  authorize: authenticateAnd(
    ifArgDefined(
      (args) => args.ids,
      or(
        userHasAccessToPetitions("ids" as never),
        and(
          petitionsArePublicTemplates("ids" as never),
          contextUserHasPermission("PETITIONS:LIST_PUBLIC_TEMPLATES"),
        ),
      ),
    ),
  ),
  validateArgs: (_, args, ctx, info) => {
    if ((args.ids?.length ?? 0) + (args.folders?.folderIds?.length ?? 0) === 0) {
      throw new ArgValidationError(
        info,
        "ids or folders",
        `Expected ids or folders.folderIds to be defined and not empty`,
      );
    }
  },
  resolve: async (_, args, ctx) => {
    const petitionIds = args.ids ?? [];
    if (isNonNullish(args.folders)) {
      const folderIds = fromGlobalIds(args.folders.folderIds, "PetitionFolder", true).ids;
      const folderPetitions = await ctx.petitions.getUserPetitionsInsideFolders(
        folderIds,
        args.folders.type === "TEMPLATE",
        ctx.user!,
      );
      petitionIds.push(...folderPetitions.map((p) => p.id));
    }
    return unique(petitionIds);
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
    authorize: authenticateAnd(
      ifArgEquals("isPublic", true, contextUserHasPermission("PETITIONS:LIST_PUBLIC_TEMPLATES")),
    ),
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
        return ctx.petitions.getPaginatedPetitionsForUser({
          orgId: ctx.user!.org_id,
          userId,
          opts: {
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
  validateArgs: validatePublicPetitionLinkSlug("slug"),
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
  validateArgs: validPath("currentPath"),
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

    const fullPaths = unique(
      [...petitionPaths, args.currentPath]
        .filter(isNonNullish)
        .flatMap((path) => pathAndParents(path))
        .filter((p) => p !== "/"),
    );
    return sort(fullPaths, (a, b) => a.localeCompare(b));
  },
});

export const standardListDefinition = queryField("standardListDefinition", {
  type: "StandardListDefinition",
  authorize: authenticate(),
  args: {
    id: nonNull(globalIdArg("StandardListDefinition")),
    locale: nonNull("UserLocale"),
  },
  resolve: async (_, { id, locale }, ctx) => {
    const standardListDefinition = await ctx.petitions.loadStandardListDefinition(id);
    if (!standardListDefinition) {
      throw new ForbiddenError("Not found");
    }

    const { values, labels } = await ctx.petitionFields.loadSelectOptionsValuesAndLabels(
      { standardList: standardListDefinition.list_type, values: [] },
      locale,
    );

    assert(isNonNullish(labels), "Labels must be defined");
    const valuesAndLabels = zip(values, labels);

    return {
      ...standardListDefinition,
      values: standardListDefinition.values.map((v) => ({
        ...v,
        // labels are not defined on standard_list_definition table, so we need to map them here
        label: valuesAndLabels.find(([value]) => value === v.key)?.[1],
      })),
    };
  },
});

export const conflictCheckProfileSearch = queryField("conflictCheckProfileSearch", {
  description: "Run a search on PROFILE_SEARCH petition field",
  type: list("Profile"),
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILE_SEARCH_FIELD"),
    userHasAccessToPetitions("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    not(petitionHasStatus("petitionId", "CLOSED")),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldHasType("fieldId", "PROFILE_SEARCH"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    search: nonNull(stringArg()),
  },
  resolve: async (_, { fieldId, search }, ctx) => {
    const field = await ctx.petitions.loadField(fieldId);
    assert(field, "Field must be defined");

    const { searchIn } = field.options as PetitionFieldOptions["PROFILE_SEARCH"];
    const profileTypeIds = searchIn.map((s) => s.profileTypeId);
    const profileTypeFieldIds = searchIn.flatMap((s) => s.profileTypeFieldIds);

    return await ctx.profiles.conflictCheckSearch(
      search,
      ctx.user!.org_id,
      profileTypeIds.filter(isNonNullish),
      profileTypeFieldIds.filter(isNonNullish),
    );
  },
});
