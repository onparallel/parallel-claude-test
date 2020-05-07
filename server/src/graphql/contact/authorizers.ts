import { FieldAuthorizeResolver } from "@nexus/schema";
import { fromGlobalId, fromGlobalIds } from "../../util/globalId";
import { Arg } from "../helpers/authorize";

export function userHasAccessToContact<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id } = fromGlobalId(args[argName], "Contact");
      return ctx.contacts.userHasAccessToContacts(ctx.user!.id, [id]);
    } catch {}
    return false;
  };
}

export function userHasAccessToContacts<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string[]>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { ids } = fromGlobalIds(args[argName], "Contact");
      return ctx.contacts.userHasAccessToContacts(ctx.user!.id, ids);
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
