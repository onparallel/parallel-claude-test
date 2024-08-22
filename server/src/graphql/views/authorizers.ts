import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { unique } from "remeda";
import { Maybe } from "../../util/types";
import { Arg } from "../helpers/authorize";

export function userHasAccessToPetitionListView<
  TypeName extends string,
  FieldName extends string,
  TArgId extends Arg<TypeName, FieldName, Maybe<number>>,
>(petitionViewIdArg: TArgId): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const id = args[petitionViewIdArg] as unknown as Maybe<number>;

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
    const ids = args[idsArg] as unknown as number[];
    const userViews = await ctx.views.loadPetitionListViewsByUserId(ctx.user!.id);
    return userViews.length === unique(ids).length && userViews.every((v) => ids.includes(v.id));
  };
}
