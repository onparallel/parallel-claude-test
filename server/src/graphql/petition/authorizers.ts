import { FieldAuthorizeResolver } from "@nexus/schema";
import { fromGlobalId, fromGlobalIds } from "../../util/globalId";
import { Arg } from "../helpers/authorize";
import { unMaybeArray } from "../../util/arrays";

export function userHasAccessToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id } = fromGlobalId(args[argName], "Petition");
      return ctx.petitions.userHasAccessToPetitions(ctx.user!.id, [id]);
    } catch {}
    return false;
  };
}

export function userHasAccessToPetitions<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string[]>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const ids = args[argName].map((arg: string) => {
        const { id } = fromGlobalId(arg, "Petition");
        return id;
      });
      return ctx.petitions.userHasAccessToPetitions(ctx.user!.id, ids);
    } catch {}
    return false;
  };
}

export function fieldBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>,
  TArg2 extends Arg<TypeName, FieldName, string>
>(
  argNamePetitionId: TArg1,
  argNameFieldId: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id: petitionId } = fromGlobalId(
        args[argNamePetitionId],
        "Petition"
      );
      const { id: fieldId } = fromGlobalId(
        args[argNameFieldId],
        "PetitionField"
      );
      return ctx.petitions.fieldsBelongToPetition(petitionId, [fieldId]);
    } catch {}
    return false;
  };
}

export function fieldsBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>,
  TArg2 extends Arg<TypeName, FieldName, string[]>
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
        args[argNameFieldIds],
        "PetitionField"
      );
      return ctx.petitions.fieldsBelongToPetition(petitionId, fieldIds);
    } catch {}
    return false;
  };
}

export function replyBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>,
  TArg2 extends Arg<TypeName, FieldName, string>
>(
  argNamePetitionId: TArg1,
  argNameReplyId: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id: petitionId } = fromGlobalId(
        args[argNamePetitionId],
        "Petition"
      );
      const { id: replyId } = fromGlobalId(
        args[argNameReplyId],
        "PetitionFieldReply"
      );
      return ctx.petitions.repliesBelongsToPetition(petitionId, [replyId]);
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
