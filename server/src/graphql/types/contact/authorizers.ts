import { FieldAuthorizeResolver } from "nexus";
import { fromGlobalId, fromGlobalIds } from "../../../util/globalId";

export function userHasAccessToContact<
  TypeName extends string,
  FieldName extends string,
  T extends string
>(argName: T): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id } = fromGlobalId(args[argName], "Contact");
      return ctx.contacts.userHasAccessToContacts(ctx.user.id, [id]);
    } catch {}
    return false;
  };
}

export function userHasAccessToContacts<
  TypeName extends string,
  FieldName extends string
>(argName: string): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { ids } = fromGlobalIds(args[argName], "Contact");
      return ctx.contacts.userHasAccessToContacts(ctx.user.id, ids);
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
