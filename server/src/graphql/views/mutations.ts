import { list, mutationField, nonNull, nullable, stringArg } from "nexus";
import { isNonNullish, maxBy } from "remeda";
import { PetitionListView } from "../../db/__types";
import { authenticate, authenticateAnd } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { userHasAccessToPetitionListView, validPetitionListViewReorder } from "./authorizers";
import { validPetitionListViewData } from "./validations";

export const createPetitionListView = mutationField("createPetitionListView", {
  description: "Creates a view with custom filters and ordering on the user's petitions list",
  type: "PetitionListView",
  authorize: authenticate(),
  args: {
    name: nonNull(stringArg()),
    data: nonNull("PetitionListViewDataInput"),
  },
  validateArgs: validPetitionListViewData((args) => args.data, "data"),
  resolve: async (_, args, ctx) => {
    const userViews = await ctx.views.loadPetitionListViewsByUserId(ctx.user!.id);
    const maxPosition = maxBy(userViews, (v) => v.position)?.position ?? -1;
    const [view] = await ctx.views.createPetitionListView(
      {
        name: args.name,
        data: args.data,
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
  authorize: authenticateAnd(userHasAccessToPetitionListView("petitionListViewId")),
  args: {
    petitionListViewId: nonNull(globalIdArg("PetitionListView")),
    name: nullable(stringArg()),
    data: "PetitionListViewDataInput",
  },
  validateArgs: validPetitionListViewData((args) => args.data, "data"),
  resolve: async (_, args, ctx) => {
    const data: Partial<PetitionListView> = {};
    if (isNonNullish(args.name)) {
      data.name = args.name;
    }
    if (args.data !== undefined) {
      data.data = args.data;
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
  authorize: authenticateAnd(userHasAccessToPetitionListView("id")),
  args: {
    id: nonNull(globalIdArg("PetitionListView")),
  },
  resolve: async (_, { id }, ctx) => {
    await ctx.views.deletePetitionListView(id, ctx.user!);
    return ctx.user!;
  },
});
