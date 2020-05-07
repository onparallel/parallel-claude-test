import { FieldAuthorizeResolver } from "@nexus/schema";
import { fromGlobalId, fromGlobalIds } from "../../util/globalId";
import { Arg } from "../helpers/authorize";

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
      return ctx.petitions.replyBelongsToPetition(replyId, petitionId);
    } catch {}
    return false;
  };
}

export function sendoutsBelongToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>,
  TArg2 extends Arg<TypeName, FieldName, string[]>
>(
  argNamePetitionId: TArg1,
  argNameSendoutIds: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id: petitionId } = fromGlobalId(
        args[argNamePetitionId],
        "Petition"
      );
      const { ids: sendoutIds } = fromGlobalIds(
        args[argNameSendoutIds],
        "PetitionSendout"
      );
      return ctx.petitions.sendoutsBelongToPetition(petitionId, sendoutIds);
    } catch {}
    return false;
  };
}
