import { ArgsValue } from "nexus/dist/core";
import { GraphQLResolveInfo } from "graphql";
import { decode } from "jsonwebtoken";
import { isDefined } from "remeda";
import {
  Petition,
  PetitionAccess,
  PetitionAccessStatus,
  PetitionField,
  PetitionStatus,
} from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { Maybe } from "../../util/types";
import { ArgValidationError, InvalidReplyError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";
import { Arg } from "../helpers/authorize";

export function validatePetitionStatus(
  petition: Maybe<Petition>,
  status: PetitionStatus,
  info: GraphQLResolveInfo
) {
  if (!petition || petition.status !== status) {
    throw new ArgValidationError(info, "petitionId", `Petition must have status "${status}".`);
  }
}

export function validateAccessesStatus(
  accesses: Maybe<PetitionAccess>[],
  status: PetitionAccessStatus,
  info: GraphQLResolveInfo
) {
  for (const access of accesses) {
    if (!access || access.status !== status) {
      throw new ArgValidationError(
        info,
        "accessId",
        `Petition access must have status "${status}".`
      );
    }
  }
}

export function validateAccessesRemindersLeft(
  accesses: Maybe<PetitionAccess>[],
  info: GraphQLResolveInfo
) {
  for (const access of accesses) {
    if (access && access.reminders_left === 0) {
      throw new ArgValidationError(
        info,
        `accessIds[${accesses.indexOf(access)}]`,
        `No reminders left.`,
        {
          errorCode: "NO_REMINDERS_LEFT",
          petitionAccessId: toGlobalId("PetitionAccess", access.id),
        }
      );
    }
  }
}

export function petitionAccessesNotOptedOut(
  accesses: Maybe<PetitionAccess>[],
  info: GraphQLResolveInfo
) {
  for (const access of accesses) {
    if (access && access.reminders_opt_out === true) {
      throw new ArgValidationError(
        info,
        `accessIds[${accesses.indexOf(access)}]`,
        `Petition access must not have opted out from receiving reminders.`,
        {
          errorCode: "REMINDERS_OPT_OUT",
          petitionAccessId: toGlobalId("PetitionAccess", access.id),
        }
      );
    }
  }
}

/**
 * checks that auth token payload contains the required keys
 */
export function validateAuthTokenPayload<TypeName extends string, FieldName extends string>(
  prop: (args: ArgsValue<TypeName, FieldName>) => string | null | undefined,
  requiredKey: string,
  argName: string
) {
  return (async (_, args, ctx, info) => {
    const token = prop(args)!;
    const payload: any = decode(token);

    const keys = requiredKey.split(".");
    let data = payload;
    keys.forEach((key) => {
      data = data[key];
      if (!isDefined(data)) {
        throw new ArgValidationError(info, argName, "Invalid token");
      }
    });
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

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
  TValuedArg extends Arg<TypeName, FieldName>
>(fieldIdArg: TFieldIdArg, valueArg: TValuedArg) {
  return (async (_, args, ctx, info) => {
    const fieldId = args[fieldIdArg] as unknown as number;
    const value = args[valueArg] as any;
    const field = (await ctx.petitions.loadField(fieldId))!;

    validateReplyValue(field, value, info, valueArg);
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateReplyUpdate<
  TypeName extends string,
  FieldName extends string,
  TReplyIdArg extends Arg<TypeName, FieldName, number>,
  TValuedArg extends Arg<TypeName, FieldName>
>(replyIdArg: TReplyIdArg, valueArg: TValuedArg) {
  return (async (_, args, ctx, info) => {
    const replyId = args[replyIdArg] as unknown as number;
    const value = args[valueArg] as any;
    const reply = (await ctx.petitions.loadFieldReply(replyId))!;
    const field = (await ctx.petitions.loadField(reply.petition_field_id))!;

    validateReplyValue(field, value, info, valueArg);
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

function validateReplyValue(
  field: PetitionField,
  value: any,
  info: GraphQLResolveInfo,
  valueArg: string
) {
  switch (field.type) {
    case "NUMBER": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new InvalidReplyError(info, valueArg, `Value must be a number`);
      }
      const options = field.options;
      const min = (options.range.min as number) ?? -Infinity;
      const max = (options.range.max as number) ?? Infinity;
      if (value > max || value < min) {
        throw new InvalidReplyError(info, valueArg, `Number must be in range [${min}, ${max}]`);
      }
      break;
    }
    default:
      break;
  }
}
