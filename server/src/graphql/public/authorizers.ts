import { PetitionFieldType } from "../../db/__types";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";
import { PublicPetitionNotAvailableError } from "../helpers/errors";
import { unMaybeArray } from "../../util/arrays";
import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";

export function fetchPetitionAccess<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>
>(argKeycode: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const keycode = (args[argKeycode] as unknown) as string;
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

export function fieldHasType<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(
  argFieldId: TArg,
  fieldType: MaybeArray<PetitionFieldType>
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const field = await ctx.petitions.loadField(
        (args[argFieldId] as unknown) as number
      );
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
  TArg1 extends Arg<TypeName, FieldName, number>
>(argFieldId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.fieldsBelongToPetition(
        ctx.access!.petition_id,
        [(args[argFieldId] as unknown) as number]
      );
    } catch {}
    return false;
  };
}

export function replyBelongsToAccess<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>
>(argReplyId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.repliesBelongsToPetition(
        ctx.access!.petition_id,
        [(args[argReplyId] as unknown) as number]
      );
    } catch {}
    return false;
  };
}

export function commentsBelongsToAccess<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argCommentId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.commentsBelongToPetition(
        ctx.access!.petition_id,
        unMaybeArray(args[argCommentId] as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}
