import { core, FieldAuthorizeResolver } from "nexus";
import { fromGlobalId } from "../../../util/globalId";
import { KeysOfType, MaybeArray } from "../../../util/types";
import { PetitionFieldType } from "../../../db/__types";

type StringArg<TypeName extends string, FieldName extends string> = KeysOfType<
  core.ArgsValue<TypeName, FieldName>,
  string
>;

type StringArrayArg<
  TypeName extends string,
  FieldName extends string
> = KeysOfType<core.ArgsValue<TypeName, FieldName>, string[]>;

export function replyBelongsToSendout<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends StringArg<TypeName, FieldName>,
  TArg2 extends StringArg<TypeName, FieldName>
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
      return await ctx.petitions.replyBelongsToSendout(
        replyId,
        args[argKeycode]
      );
    } catch {}
    return false;
  };
}

export function fieldBelongsToSendout<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends StringArg<TypeName, FieldName>,
  TArg2 extends StringArg<TypeName, FieldName>
>(
  argFieldId: TArg1,
  argKeycode: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const { id: fieldId } = fromGlobalId(args[argFieldId], "PetitionField");
      return await ctx.petitions.fieldBelongsToSendout(
        fieldId,
        args[argKeycode]
      );
    } catch {}
    return false;
  };
}

export function fetchSendout<
  TypeName extends string,
  FieldName extends string,
  TArg extends StringArg<TypeName, FieldName>
>(argKeycode: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const keycode = args[argKeycode] as string;
      ctx.sendout = await ctx.petitions.loadSendoutByKeycode(keycode);
      ctx.contact = await ctx.contacts.loadOneById(ctx.sendout!.contact_id);
      return true;
    } catch {
      return false;
    }
  };
}

export function fieldHastype<
  TypeName extends string,
  FieldName extends string,
  TArg extends StringArg<TypeName, FieldName>
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
