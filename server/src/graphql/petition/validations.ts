import { ArgsValue } from "nexus/dist/core";
import { validateReplyValue } from "../../util/validateReplyValue";
import { Arg } from "../helpers/authorize";
import { ArgValidationError, InvalidReplyError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

export function validatePublicPetitionLinkSlug<TypeName extends string, FieldName extends string>(
  slugArg: (args: ArgsValue<TypeName, FieldName>) => string,
  argName: string,
  publicPetitionLinkIdArg?: (args: ArgsValue<TypeName, FieldName>) => number
) {
  const MIN_SLUG_LENGTH = 8;
  const MAX_SLUG_LENGTH = 30;

  return (async (_, args, ctx, info) => {
    const slug = slugArg(args);
    const publicPetitionLinkId = publicPetitionLinkIdArg?.(args);

    if (slug.length < MIN_SLUG_LENGTH) {
      throw new ArgValidationError(
        info,
        argName,
        `Value can't have less than ${MIN_SLUG_LENGTH} characters.`,
        { code: "MIN_SLUG_LENGTH_VALIDATION_ERROR" }
      );
    }
    if (slug.length > MAX_SLUG_LENGTH) {
      throw new ArgValidationError(
        info,
        argName,
        `Value can't have more than ${MAX_SLUG_LENGTH} characters.`,
        { code: "MAX_SLUG_LENGTH_VALIDATION_ERROR" }
      );
    }
    if (!slug.match(/^[a-zA-Z0-9-]*$/)) {
      throw new ArgValidationError(info, argName, `Slug must match /^[a-zA-Z0-9-]*$/`, {
        code: "INVALID_SLUG_CHARS_VALIDATION_ERROR",
      });
    }

    const publicLink = await ctx.petitions.loadPublicPetitionLinkBySlug(slug);
    if (publicLink && publicLink.id !== publicPetitionLinkId) {
      throw new ArgValidationError(
        info,
        argName,
        "Slug is already being used on another public link",
        { code: "SLUG_ALREADY_TAKEN_VALIDATION_ERROR" }
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateFieldReply<
  TypeName extends string,
  FieldName extends string,
  TFieldIdArg extends Arg<TypeName, FieldName, number>,
  TValuedArg extends Arg<TypeName, FieldName, any>
>(fieldIdArg: TFieldIdArg, valueArg: TValuedArg, argName: string) {
  return (async (_, args, ctx, info) => {
    const fieldId = args[fieldIdArg] as unknown as number;
    const value = args[valueArg] as any;
    const field = (await ctx.petitions.loadField(fieldId))!;

    try {
      validateReplyValue(field, value);
    } catch (error: any) {
      throw new InvalidReplyError(info, argName, error.message, {
        subcode: error.code,
      });
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateReplyUpdate<
  TypeName extends string,
  FieldName extends string,
  TReplyIdArg extends Arg<TypeName, FieldName, number>,
  TValuedArg extends Arg<TypeName, FieldName>
>(replyIdArg: TReplyIdArg, valueArg: TValuedArg, argName: string) {
  return (async (_, args, ctx, info) => {
    const replyId = args[replyIdArg] as unknown as number;
    const value = args[valueArg] as any;
    const field = (await ctx.petitions.loadFieldForReply(replyId))!;

    try {
      validateReplyValue(field, value);
    } catch (error: any) {
      throw new InvalidReplyError(info, argName, error.message, {
        subcode: error.code,
      });
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
