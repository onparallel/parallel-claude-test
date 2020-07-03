import { FieldAuthorizeResolver } from "@nexus/schema";
import { PetitionFieldType } from "../../db/__types";
import { fromGlobalId, fromGlobalIds } from "../../util/globalId";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";
import { PublicPetitionNotAvailableError } from "../helpers/errors";
import { unMaybeArray } from "../../util/arrays";

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
      const [contact, petition] = await Promise.all([
        ctx.contacts.loadContact(access.contact_id),
        ctx.petitions.loadPetition(access.petition_id),
      ]);
      if (!petition) {
        throw new PublicPetitionNotAvailableError(
          `Petition for petition access with keycode ${keycode} not found`
        );
      }
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

export function fieldBelongsToAccess<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>
>(argFieldId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const { id: fieldId } = fromGlobalId(args[argFieldId], "PetitionField");
      return await ctx.petitions.fieldsBelongToPetition(
        ctx.access!.petition_id,
        [fieldId]
      );
    } catch {}
    return false;
  };
}

export function replyBelongsToAccess<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>
>(argReplyId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const { id: replyId } = fromGlobalId(
        args[argReplyId],
        "PetitionFieldReply"
      );
      return await ctx.petitions.repliesBelongsToPetition(
        ctx.access!.petition_id,
        [replyId]
      );
    } catch {}
    return false;
  };
}

export function commentsBelongsToAccess<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string | string[]>
>(argCommentId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const { ids: commentIds } = fromGlobalIds(
        unMaybeArray(args[argCommentId]),
        "PetitionFieldComment"
      );
      return await ctx.petitions.commentsBelongToPetition(
        ctx.access!.petition_id,
        commentIds
      );
    } catch {}
    return false;
  };
}
