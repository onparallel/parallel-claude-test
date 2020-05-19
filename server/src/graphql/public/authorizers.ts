import { FieldAuthorizeResolver } from "@nexus/schema";
import { PetitionFieldType } from "../../db/__types";
import { fromGlobalId } from "../../util/globalId";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";
import { PublicPetitionNotAvailableError } from "../helpers/errors";

export function replyBelongsToAccess<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>,
  TArg2 extends Arg<TypeName, FieldName, string>
>(
  argReplyId: TArg1,
  argKeycode: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const { id: replyId } = fromGlobalId(
        args[argReplyId],
        "PetitionFieldReply"
      );
      return await ctx.petitions.replyBelongsToAccess(
        replyId,
        args[argKeycode]
      );
    } catch {}
    return false;
  };
}

export function fieldBelongsToAccess<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>,
  TArg2 extends Arg<TypeName, FieldName, string>
>(
  argFieldId: TArg1,
  argKeycode: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const { id: fieldId } = fromGlobalId(args[argFieldId], "PetitionField");
      return await ctx.petitions.fieldBelongsToAccess(
        fieldId,
        args[argKeycode]
      );
    } catch {}
    return false;
  };
}

export function fetchPetitionAccess<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>
>(argKeycode: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const keycode = args[argKeycode] as string;
    const access = await ctx.petitions.loadAccessByKeycode(keycode);
    if (!access) {
      throw new PublicPetitionNotAvailableError(
        `Petition access with keycode ${keycode} not found`
      );
    } else if (access.status !== "ACTIVE") {
      throw new PublicPetitionNotAvailableError(
        `Petition access with keycode ${keycode} not active`
      );
    } else {
      ctx.access = access;
      const contact = await ctx.contacts.loadContact(access.contact_id);
      if (!contact) {
        throw new PublicPetitionNotAvailableError(
          `Contact for petition access with keycode ${keycode} not found`
        );
      } else {
        ctx.contact = contact;
      }
    }
    return true;
  };
}

export function fieldHastype<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>
>(
  argFieldId: TArg,
  fieldType: MaybeArray<PetitionFieldType>
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const { id: fieldId } = fromGlobalId(args[argFieldId], "PetitionField");
      const field = await ctx.petitions.loadField(fieldId);
      return Array.isArray(fieldType)
        ? fieldType.includes(field!.type)
        : fieldType === field!.type;
    } catch {}
    return false;
  };
}
