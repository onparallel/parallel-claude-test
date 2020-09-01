import { FieldAuthorizeResolver } from "@nexus/schema";
import { Arg } from "../helpers/authorize";
import { unMaybeArray } from "../../util/arrays";
import { PetitionUserPermissionType } from "../../db/__types";
import { MaybeArray } from "../../util/types";

export function userHasAccessToPetitions<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(
  argName: TArg,
  permissionTypes?: PetitionUserPermissionType[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const petitionIds = unMaybeArray(args[argName]);
      if (petitionIds.length === 0) {
        return true;
      }
      return ctx.petitions.userHasAccessToPetitions(
        ctx.user!.id,
        petitionIds,
        permissionTypes
      );
    } catch {}
    return false;
  };
}

export function petitionIsPublicTemplate<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const templateId = args[argName];
      return ctx.petitions.isPublicTemplate(templateId);
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
        args[argNameFieldId] as number
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
  return (_, args, ctx) => {
    try {
      return ctx.petitions.fieldsBelongToPetition(
        args[argNamePetitionId],
        unMaybeArray(args[argNameFieldIds])
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
  return (_, args, ctx) => {
    try {
      return ctx.petitions.repliesBelongsToPetition(
        args[argNamePetitionId],
        unMaybeArray(args[argNameReplyIds])
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
  return (_, args, ctx) => {
    try {
      return ctx.petitions.repliesBelongsToField(
        args[argNameFieldId],
        unMaybeArray(args[argNameReplyIds])
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
  return (_, args, ctx) => {
    try {
      return ctx.petitions.accesessBelongToPetition(
        args[argNamePetitionId],
        unMaybeArray(args[argNameAccessIds])
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
  return (_, args, ctx) => {
    try {
      return ctx.petitions.messagesBelongToPetition(args[argNamePetitionId], [
        args[argNameMessageId],
      ]);
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
  return (_, args, ctx) => {
    try {
      return ctx.petitions.commentsBelongToPetition(
        args[argNamePetitionId],
        unMaybeArray(args[argNameCommentIds])
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
  return (_, args, ctx) => {
    try {
      return ctx.petitions.accessesBelongToValidContacts(
        unMaybeArray(args[argNameAccessIds])
      );
    } catch {}
    return false;
  };
}
