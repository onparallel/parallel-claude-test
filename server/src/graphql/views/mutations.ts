import { list, mutationField, nonNull, nullable, stringArg } from "nexus";
import { firstBy, isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { PetitionListView, ProfileListView } from "../../db/__types";
import { fromGlobalId } from "../../util/globalId";
import { NexusGenInputs } from "../__types";
import { and, authenticateAnd, ifArgDefined, not } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { validateAnd } from "../helpers/validateArgs";
import {
  petitionsAreNotScheduledForDeletion,
  userHasAccessToPetitions,
} from "../petition/authorizers";
import {
  validApprovalsFilter,
  validPetitionSharedWithFilter,
  validPetitionTagFilter,
} from "../petition/types";
import { profileTypeIsArchived, userHasAccessToProfileType } from "../profile/authorizers";
import {
  petitionListViewHasType,
  profileListViewBelongsToProfileType,
  profileListViewHasType,
  userHasAccessToPetitionListView,
  userHasAccessToProfileListView,
  validPetitionListViewReorder,
  validProfileListViewReorder,
} from "./authorizers";
import { mapProfileListViewDataToDatabase } from "./helpers";
import { validProfileListViewDataInput } from "./validations";

function mapPetitionListViewData(input: NexusGenInputs["PetitionListViewDataInput"] | null) {
  if (!input) {
    return null;
  }

  return {
    fromTemplateId: input.fromTemplateId ?? null,
    path: input.path ?? "/",
    search: input.search ?? null,
    searchIn: input.searchIn ?? "EVERYWHERE",
    sharedWith: input.sharedWith ?? null,
    signature: input.signature ?? null,
    status: input.status ?? null,
    tagsFilters: input.tagsFilters ?? null,
    approvals: input.approvals
      ? {
          ...input.approvals,
          filters: input.approvals.filters.map((f) => ({
            ...f,
            value: f.operator === "ASSIGNED_TO" ? fromGlobalId(f.value, "User").id : f.value,
          })),
        }
      : null,
    sort: input.sort ?? null,
    columns: input.columns ?? null,
    scheduledForDeletion: input.scheduledForDeletion ?? null,
  };
}

// ###############
// PETITION VIEWS
// ###############
export const createPetitionListView = mutationField("createPetitionListView", {
  description: "Creates a view with custom filters and ordering on the user's petitions list",
  type: "PetitionListView",
  authorize: authenticateAnd(
    ifArgDefined(
      "data.fromTemplateId",
      and(
        userHasAccessToPetitions("data.fromTemplateId" as never),
        petitionsAreNotScheduledForDeletion("data.fromTemplateId" as never),
      ),
    ),
  ),
  args: {
    name: nonNull(stringArg()),
    data: nonNull("PetitionListViewDataInput"),
  },
  validateArgs: validateAnd(
    validPetitionSharedWithFilter("data.sharedWith"),
    validPetitionTagFilter("data.tagsFilters"),
    validApprovalsFilter("data.approvals"),
    async (_, args, ctx, info) => {
      const fromTemplateId = args.data.fromTemplateId;
      if (isNonNullish(fromTemplateId)) {
        const hasAccess = await ctx.petitions.userHasAccessToPetitions(
          ctx.user!.id,
          fromTemplateId,
        );
        if (!hasAccess) {
          throw new ArgValidationError(info, `${name}.fromTemplateId`, "Invalid template ID");
        }
      }
    },
  ),
  resolve: async (_, args, ctx) => {
    const userViews = await ctx.views.loadPetitionListViewsByUserId(ctx.user!.id);
    const maxPosition = firstBy(userViews, [(v) => v.position, "desc"])?.position ?? -1;

    const [view] = await ctx.views.createPetitionListView(
      {
        name: args.name,
        data: mapPetitionListViewData(args.data),
        user_id: ctx.user!.id,
        position: maxPosition + 1,
      },
      `User:${ctx.user!.id}`,
    );
    ctx.views.loadPetitionListViewsByUserId.dataloader.clear(ctx.user!.id);
    return view;
  },
});

export const updatePetitionListView = mutationField("updatePetitionListView", {
  description: "Updates a petition list view",
  type: "PetitionListView",
  authorize: authenticateAnd(
    userHasAccessToPetitionListView("petitionListViewId"),
    ifArgDefined(
      (args) =>
        args.name ??
        args.data?.fromTemplateId ??
        args.data?.path ??
        args.data?.search ??
        args.data?.searchIn ??
        args.data?.sharedWith ??
        args.data?.signature ??
        args.data?.status ??
        args.data?.tagsFilters ??
        args.data?.approvals,
      petitionListViewHasType("petitionListViewId", "CUSTOM"),
    ),
    ifArgDefined(
      "data.fromTemplateId",
      and(
        userHasAccessToPetitions("data.fromTemplateId" as never),
        petitionsAreNotScheduledForDeletion("data.fromTemplateId" as never),
      ),
    ),
  ),
  args: {
    petitionListViewId: nonNull(globalIdArg("PetitionListView")),
    name: nullable(stringArg()),
    data: "PetitionListViewDataInput",
  },
  validateArgs: validateAnd(
    validPetitionSharedWithFilter("data.sharedWith"),
    validPetitionTagFilter("data.tagsFilters"),
    validApprovalsFilter("data.approvals"),
    async (_, args, ctx, info) => {
      const fromTemplateId = args.data?.fromTemplateId;
      if (isNonNullish(fromTemplateId)) {
        const hasAccess = await ctx.petitions.userHasAccessToPetitions(
          ctx.user!.id,
          fromTemplateId,
        );
        if (!hasAccess) {
          throw new ArgValidationError(info, `${name}.fromTemplateId`, "Invalid template ID");
        }
      }
    },
  ),
  resolve: async (_, args, ctx) => {
    const data: Partial<PetitionListView> = {};
    if (isNonNullish(args.name)) {
      data.name = args.name;
    }
    if (args.data !== undefined) {
      data.data = mapPetitionListViewData(args.data);
    }
    return await ctx.views.updatePetitionListView(args.petitionListViewId, data, ctx.user!);
  },
});

export const markPetitionListViewAsDefault = mutationField("markPetitionListViewAsDefault", {
  description:
    "Sets the default petition list view of the user. If passing null id, default view will be set (no filters/sorting)",
  type: "User",
  authorize: authenticateAnd(userHasAccessToPetitionListView("petitionListViewId" as never)),
  args: {
    petitionListViewId: nullable(globalIdArg("PetitionListView")),
  },
  resolve: async (_, { petitionListViewId }, ctx) => {
    await ctx.views.markDefaultPetitionListView(petitionListViewId ?? null, ctx.user!);
    return ctx.user!;
  },
});

export const reorderPetitionListViews = mutationField("reorderPetitionListViews", {
  description: "Changes the ordering of a user's petition list views",
  type: "User",
  authorize: authenticateAnd(validPetitionListViewReorder("ids")),
  args: {
    ids: nonNull(list(nonNull(globalIdArg("PetitionListView")))),
  },
  resolve: async (_, { ids }, ctx) => {
    await ctx.views.reorderPetitionListViewsByUserId(ctx.user!.id, ids);
    ctx.views.loadPetitionListViewsByUserId.dataloader.clear(ctx.user!.id);
    return ctx.user!;
  },
});

export const deletePetitionListView = mutationField("deletePetitionListView", {
  description: "Deletes a petition list view of the user",
  type: "User",
  authorize: authenticateAnd(
    userHasAccessToPetitionListView("id"),
    petitionListViewHasType("id", "CUSTOM"),
  ),
  args: {
    id: nonNull(globalIdArg("PetitionListView")),
  },
  resolve: async (_, { id }, ctx) => {
    await ctx.views.deletePetitionListView(id, ctx.user!);
    return ctx.user!;
  },
});

// ###############
// PROFILE VIEWS
// ###############
export const createProfileListView = mutationField("createProfileListView", {
  description: "Creates a view with custom filters and ordering on the user's profile list",
  type: "ProfileListView",
  authorize: authenticateAnd(
    userHasAccessToProfileType("profileTypeId"),
    not(profileTypeIsArchived("profileTypeId")),
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    name: nonNull(stringArg()),
    data: nonNull("ProfileListViewDataInput"),
  },
  validateArgs: validProfileListViewDataInput("profileTypeId", "data"),
  resolve: async (_, args, ctx) => {
    const userViews = await ctx.views.loadProfileListViewsByUserIdProfileTypeId({
      userId: ctx.user!.id,
      profileTypeId: args.profileTypeId,
    });
    const maxPosition = firstBy(userViews, [(v) => v.position, "desc"])?.position ?? -1;
    const [view] = await ctx.views.createProfileListView(
      {
        profile_type_id: args.profileTypeId,
        name: args.name,
        data: mapProfileListViewDataToDatabase(args.data),
        user_id: ctx.user!.id,
        position: maxPosition + 1,
      },
      `User:${ctx.user!.id}`,
    );
    ctx.views.loadProfileListViewsByUserIdProfileTypeId.dataloader.clear({
      userId: ctx.user!.id,
      profileTypeId: args.profileTypeId,
    });
    return view;
  },
});

export const updateProfileListView = mutationField("updateProfileListView", {
  description: "Updates a profile list view",
  type: "ProfileListView",
  authorize: authenticateAnd(
    userHasAccessToProfileListView("profileListViewId"),
    profileListViewBelongsToProfileType("profileListViewId", "profileTypeId"),
    ifArgDefined("name", profileListViewHasType("profileListViewId", "CUSTOM")),
    ifArgDefined("data.search", profileListViewHasType("profileListViewId", "CUSTOM")),
    ifArgDefined("data.status", profileListViewHasType("profileListViewId", "CUSTOM")),
    ifArgDefined("data.values", profileListViewHasType("profileListViewId", "CUSTOM")),
  ),
  args: {
    profileListViewId: nonNull(globalIdArg("ProfileListView")),
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    name: nullable(stringArg()),
    data: "ProfileListViewDataInput",
  },
  validateArgs: validProfileListViewDataInput("profileTypeId", "data"),
  resolve: async (_, args, ctx) => {
    const data: Partial<ProfileListView> = {};
    if (isNonNullish(args.name)) {
      data.name = args.name;
    }
    if (args.data !== undefined) {
      data.data = args.data !== null ? mapProfileListViewDataToDatabase(args.data) : null;
    }
    return await ctx.views.updateProfileListView(args.profileListViewId, data, ctx.user!);
  },
});

export const markProfileListViewAsDefault = mutationField("markProfileListViewAsDefault", {
  description:
    "Sets the default profile list view of the user. If passing null id, default view will be set (no filters/sorting)",
  type: "ProfileListView",
  authorize: authenticateAnd(
    userHasAccessToProfileListView("profileListViewId"),
    profileListViewBelongsToProfileType("profileListViewId", "profileTypeId"),
  ),
  args: {
    profileListViewId: nonNull(globalIdArg("ProfileListView")),
    profileTypeId: nonNull(globalIdArg("ProfileType")),
  },
  resolve: async (_, { profileListViewId, profileTypeId }, ctx) => {
    const view = await ctx.views.markDefaultProfileListView(
      profileListViewId,
      profileTypeId,
      ctx.user!,
    );
    assert(view, "View not found");
    return view;
  },
});

export const reorderProfileListViews = mutationField("reorderProfileListViews", {
  description: "Changes the ordering of a user's profile list views",
  type: "User",
  authorize: authenticateAnd(
    userHasAccessToProfileListView("ids"),
    validProfileListViewReorder("ids", "profileTypeId"),
    profileListViewBelongsToProfileType("ids", "profileTypeId"),
  ),
  args: {
    ids: nonNull(list(nonNull(globalIdArg("ProfileListView")))),
    profileTypeId: nonNull(globalIdArg("ProfileType")),
  },
  resolve: async (_, { ids, profileTypeId }, ctx) => {
    await ctx.views.reorderProfileListViewsByUserId(ctx.user!.id, profileTypeId, ids);
    ctx.views.loadProfileListViewsByUserIdProfileTypeId.dataloader.clear({
      userId: ctx.user!.id,
      profileTypeId,
    });
    return ctx.user!;
  },
});

export const deleteProfileListView = mutationField("deleteProfileListView", {
  description: "Deletes a profile list view of the user",
  type: "User",
  authorize: authenticateAnd(
    userHasAccessToProfileListView("id"),
    profileListViewHasType("id", "CUSTOM"),
  ),
  args: {
    id: nonNull(globalIdArg("ProfileListView")),
  },
  resolve: async (_, { id }, ctx) => {
    await ctx.views.deleteProfileListView(id, ctx.user!);
    return ctx.user!;
  },
});
