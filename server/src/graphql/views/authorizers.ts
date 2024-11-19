import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isNullish, unique } from "remeda";
import { ListViewType } from "../../db/__types";
import { Maybe, MaybeArray, unMaybeArray } from "../../util/types";
import { Arg, getArg } from "../helpers/authorize";

export function userHasAccessToPetitionListView<
  TypeName extends string,
  FieldName extends string,
  TArgId extends Arg<TypeName, FieldName, Maybe<number>>,
>(petitionViewIdArg: TArgId): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const id = getArg(args, petitionViewIdArg);

    if (!id) {
      // null id means default view, everyone has access
      return true;
    }

    const view = await ctx.views.loadPetitionListView(id);
    return !!view && view.user_id === ctx.user!.id;
  };
}

export function validPetitionListViewReorder<
  TypeName extends string,
  FieldName extends string,
  TArgIds extends Arg<TypeName, FieldName, number[]>,
>(idsArg: TArgIds): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const ids = getArg(args, idsArg);
    const userViews = await ctx.views.loadPetitionListViewsByUserId(ctx.user!.id);
    return userViews.length === unique(ids).length && userViews.every((v) => ids.includes(v.id));
  };
}

export function petitionListViewHasType<
  TypeName extends string,
  FieldName extends string,
  TArgIds extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(idsArg: TArgIds, type: ListViewType): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const ids = unMaybeArray(getArg(args, idsArg));
    const userViews = await ctx.views.loadPetitionListView(ids);
    return userViews.every((v) => v?.view_type === type);
  };
}

export function userHasAccessToProfileListView<
  TypeName extends string,
  FieldName extends string,
  TArgId extends Arg<TypeName, FieldName, MaybeArray<number> | null>,
>(profileViewIdArg: TArgId): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileViewIds = getArg(args, profileViewIdArg);
    if (isNullish(profileViewIds)) {
      // null id means default view, everyone has access
      return true;
    }

    const views = await ctx.views.loadProfileListView(unMaybeArray(profileViewIds));
    return views.every((v) => v && v.user_id === ctx.user!.id);
  };
}

export function validProfileListViewReorder<
  TypeName extends string,
  FieldName extends string,
  TArgIds extends Arg<TypeName, FieldName, number[]>,
  TArgProfileTypeId extends Arg<TypeName, FieldName, number>,
>(
  idsArg: TArgIds,
  profileTypeIdArg: TArgProfileTypeId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const ids = getArg(args, idsArg);
    const profileTypeId = getArg(args, profileTypeIdArg);
    const userViews = await ctx.views.loadProfileListViewsByUserIdProfileTypeId({
      userId: ctx.user!.id,
      profileTypeId,
    });
    return userViews.length === unique(ids).length && userViews.every((v) => ids.includes(v.id));
  };
}

export function profileListViewHasType<
  TypeName extends string,
  FieldName extends string,
  TArgIds extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(idsArg: TArgIds, type: ListViewType): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const ids = unMaybeArray(getArg(args, idsArg));
    const userViews = await ctx.views.loadProfileListView(ids);
    return userViews.every((v) => v?.view_type === type);
  };
}

export function profileListViewBelongsToProfileType<
  TypeName extends string,
  FieldName extends string,
  TArgProfileListViewId extends Arg<TypeName, FieldName, MaybeArray<number>>,
  TArgProfileTypeId extends Arg<TypeName, FieldName, number>,
>(
  profileListViewIdArg: TArgProfileListViewId,
  profileTypeIdArg: TArgProfileTypeId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileListViewIds = unMaybeArray(getArg(args, profileListViewIdArg));
    const profileTypeId = getArg(args, profileTypeIdArg);

    const views = await ctx.views.loadProfileListView(profileListViewIds);
    return views.every((v) => v?.profile_type_id === profileTypeId);
  };
}
