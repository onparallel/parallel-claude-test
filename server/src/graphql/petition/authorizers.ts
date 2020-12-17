import { Arg } from "../helpers/authorize";
import { unMaybeArray } from "../../util/arrays";
import { FeatureFlagName, PetitionUserPermissionType } from "../../db/__types";
import { MaybeArray } from "../../util/types";
import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";

export function userHasAccessToPetitions<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(
  argName: TArg,
  permissionTypes?: PetitionUserPermissionType[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const petitionIds = unMaybeArray(args[argName] as MaybeArray<number>);
      if (petitionIds.length === 0) {
        return true;
      }
      return await ctx.petitions.userHasAccessToPetitions(
        ctx.user!.id,
        petitionIds,
        permissionTypes
      );
    } catch {}
    return false;
  };
}

export function userHasAccessToSignatureRequest<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(
  argName: TArg,
  permissionTypes?: PetitionUserPermissionType[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const signatureRequestIds = unMaybeArray(
        args[argName] as MaybeArray<number>
      );
      if (signatureRequestIds.length === 0) {
        return true;
      }

      return await ctx.petitions.userHasAccessToPetitionSignatureRequests(
        ctx.user!.id,
        signatureRequestIds,
        permissionTypes
      );
    } catch {}
    return false;
  };
}

export function petitionsArePublicTemplates<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number | number[]>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const templateIds = args[argName];
      return await ctx.petitions.arePublicTemplates(templateIds);
    } catch {}
    return false;
  };
}

export function fieldIsNotFixed<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>
>(argNameFieldId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const field = await ctx.petitions.loadField(
        (args[argNameFieldId] as unknown) as number
      );
      return !field!.is_fixed;
    } catch {}
    return false;
  };
}

export function fieldsBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(
  argNamePetitionId: TArg1,
  argNameFieldIds: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.fieldsBelongToPetition(
        (args[argNamePetitionId] as unknown) as number,
        unMaybeArray(args[argNameFieldIds] as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function repliesBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(
  argNamePetitionId: TArg1,
  argNameReplyIds: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.repliesBelongsToPetition(
        (args[argNamePetitionId] as unknown) as number,
        unMaybeArray(args[argNameReplyIds] as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function repliesBelongsToField<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(
  argNameFieldId: TArg1,
  argNameReplyIds: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.repliesBelongsToField(
        (args[argNameFieldId] as unknown) as number,
        unMaybeArray(args[argNameReplyIds] as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function accessesBelongToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(
  argNamePetitionId: TArg1,
  argNameAccessIds: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.accessesBelongToPetition(
        (args[argNamePetitionId] as unknown) as number,
        unMaybeArray(args[argNameAccessIds] as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function messageBelongToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, number>
>(
  argNamePetitionId: TArg1,
  argNameMessageId: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.messagesBelongToPetition(
        (args[argNamePetitionId] as unknown) as number,
        [(args[argNameMessageId] as unknown) as number]
      );
    } catch {}
    return false;
  };
}

export function commentsBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(
  argNamePetitionId: TArg1,
  argNameCommentIds: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.commentsBelongToPetition(
        (args[argNamePetitionId] as unknown) as number,
        unMaybeArray(args[argNameCommentIds] as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function accessesBelongToValidContacts<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argNameAccessIds: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.accessesBelongToValidContacts(
        unMaybeArray(args[argNameAccessIds] as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function userHasFeatureFlag<
  TypeName extends string,
  FieldName extends string
>(feature: FeatureFlagName): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.featureFlags.userHasFeatureFlag(ctx.user!.id, feature);
    } catch {}
    return false;
  };
}
