import { FieldAuthorizeResolver } from "nexus";
import { fromGlobalId, fromGlobalIds } from "../../../util/globalId";

export function userHasAccessToPetition<
  TypeName extends string,
  FieldName extends string,
  T extends string
>(argName: T): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id } = fromGlobalId(args[argName], "Petition");
      return ctx.petitions.userHasAccessToPetitions(ctx.user.id, [id]);
    } catch {}
    return false;
  };
}

export function userHasAccessToPetitions<
  TypeName extends string,
  FieldName extends string
>(argName: string): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const ids = args[argName].map((arg: string) => {
        const { id } = fromGlobalId(arg, "Petition");
        return id;
      });
      return ctx.petitions.userHasAccessToPetitions(ctx.user.id, ids);
    } catch {}
    return false;
  };
}

export function fieldBelongsToPetition<
  TypeName extends string,
  FieldName extends string
>(
  argNamePetitionId: string,
  argNameFieldId: string
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
  FieldName extends string
>(
  argNamePetitionId: string,
  argNameFieldIds: string
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
