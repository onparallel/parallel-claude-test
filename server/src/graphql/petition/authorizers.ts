import { FieldAuthorizeResolver } from "@nexus/schema";
import { fromGlobalId, fromGlobalIds } from "../../util/globalId";
import { Arg } from "../helpers/authorize";
import { unMaybeArray } from "../../util/arrays";

export function userHasAccessToPetitions<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string | string[]>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { ids: petitionIds } = fromGlobalIds(
        unMaybeArray(args[argName]),
        "Petition"
      );
      return ctx.petitions.userHasAccessToPetitions(ctx.user!.id, petitionIds);
    } catch {}
    return false;
  };
}

export function fieldIsNotFixed<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>
>(argNameFIeldId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const { id: fieldId } = fromGlobalId(
        args[argNameFIeldId],
        "PetitionField"
      );
      const field = await ctx.petitions.loadField(fieldId);
      return !field!.is_fixed;
    } catch {}
    return false;
  };
}

export function fieldsBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>,
  TArg2 extends Arg<TypeName, FieldName, string | string[]>
>(
  argNamePetitionId: TArg1,
  argNameFieldIds: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id: petitionId } = fromGlobalId(
        args[argNamePetitionId],
        "Petition"
      );
      const { ids: fieldIds } = fromGlobalIds(
        unMaybeArray(args[argNameFieldIds]),
        "PetitionField"
      );
      return ctx.petitions.fieldsBelongToPetition(petitionId, fieldIds);
    } catch {}
    return false;
  };
}

export function repliesBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>,
  TArg2 extends Arg<TypeName, FieldName, string | string[]>
>(
  argNamePetitionId: TArg1,
  argNameReplyIds: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id: petitionId } = fromGlobalId(
        args[argNamePetitionId],
        "Petition"
      );
      const { ids: replyIds } = fromGlobalIds(
        unMaybeArray(args[argNameReplyIds]),
        "PetitionFieldReply"
      );
      return ctx.petitions.repliesBelongsToPetition(petitionId, replyIds);
    } catch {}
    return false;
  };
}

export function repliesBelongsToField<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>,
  TArg2 extends Arg<TypeName, FieldName, string | string[]>
>(
  argNameFieldId: TArg1,
  argNameReplyIds: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id: petitionFieldId } = fromGlobalId(
        args[argNameFieldId],
        "PetitionField"
      );
      const { ids: replyIds } = fromGlobalIds(
        unMaybeArray(args[argNameReplyIds]),
        "PetitionFieldReply"
      );
      return ctx.petitions.repliesBelongsToField(petitionFieldId, replyIds);
    } catch {}
    return false;
  };
}

export function accessesBelongToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>,
  TArg2 extends Arg<TypeName, FieldName, string[]>
>(
  argNamePetitionId: TArg1,
  argNameaccessIds: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id: petitionId } = fromGlobalId(
        args[argNamePetitionId],
        "Petition"
      );
      const { ids: accessIds } = fromGlobalIds(
        args[argNameaccessIds],
        "PetitionAccess"
      );
      return ctx.petitions.accesessBelongToPetition(petitionId, accessIds);
    } catch {}
    return false;
  };
}

export function messageBelongToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>,
  TArg2 extends Arg<TypeName, FieldName, string>
>(
  argNamePetitionId: TArg1,
  argNameMessageId: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id: petitionId } = fromGlobalId(
        args[argNamePetitionId],
        "Petition"
      );
      const { id: messageId } = fromGlobalId(
        args[argNameMessageId],
        "PetitionMessage"
      );
      return ctx.petitions.messagesBelongToPetition(petitionId, [messageId]);
    } catch {}
    return false;
  };
}

export function commentsBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>,
  TArg2 extends Arg<TypeName, FieldName, string | string[]>
>(
  argNamePetitionId: TArg1,
  argNameCommentIds: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id: petitionId } = fromGlobalId(
        args[argNamePetitionId],
        "Petition"
      );
      const { ids: commentIds } = fromGlobalIds(
        unMaybeArray(args[argNameCommentIds]),
        "PetitionFieldComment"
      );
      return ctx.petitions.commentsBelongToPetition(petitionId, commentIds);
    } catch {}
    return false;
  };
}

export function accessesBelongToValidContacts<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string[]>
>(argNameAccessIds: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { ids: accessIds } = fromGlobalIds(
        args[argNameAccessIds],
        "PetitionAccess"
      );
      return ctx.petitions.accessesBelongToValidContacts(accessIds);
    } catch {}
    return false;
  };
}
