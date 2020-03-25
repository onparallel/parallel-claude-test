import { FieldAuthorizeResolver, core } from "nexus";
import { fromGlobalId, fromGlobalIds } from "../../../util/globalId";
import { KeysOfType } from "../../../util/types";

type StringArg<TypeName extends string, FieldName extends string> = KeysOfType<
  core.ArgsValue<TypeName, FieldName>,
  string
>;

type StringArrayArg<
  TypeName extends string,
  FieldName extends string
> = KeysOfType<core.ArgsValue<TypeName, FieldName>, string[]>;

export function userHasAccessToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg extends StringArg<TypeName, FieldName>
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
  TArg extends StringArrayArg<TypeName, FieldName>
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
  TArg1 extends StringArg<TypeName, FieldName>,
  TArg2 extends StringArg<TypeName, FieldName>
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
  TArg1 extends StringArg<TypeName, FieldName>,
  TArg2 extends StringArrayArg<TypeName, FieldName>
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
  TArg1 extends StringArg<TypeName, FieldName>,
  TArg2 extends StringArg<TypeName, FieldName>
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
