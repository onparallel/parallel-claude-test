import { GraphQLResolveInfo } from "graphql";
import { decode } from "jsonwebtoken";
import { isPossiblePhoneNumber } from "libphonenumber-js";
import { ArgsValue } from "nexus/dist/core";
import { difference, isDefined } from "remeda";
import {
  Petition,
  PetitionAccess,
  PetitionAccessStatus,
  PetitionField,
  PetitionStatus,
} from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { Maybe } from "../../util/types";
import { isValidDate } from "../../util/validators";
import { Arg } from "../helpers/authorize";
import { ArgValidationError, InvalidReplyError } from "../helpers/errors";
import { DynamicSelectOption } from "../helpers/parseDynamicSelectValues";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

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
  TValuedArg extends Arg<TypeName, FieldName, any>
>(fieldIdArg: TFieldIdArg, valueArg: TValuedArg, argName: string) {
  return (async (_, args, ctx, info) => {
    const fieldId = args[fieldIdArg] as unknown as number;
    const value = args[valueArg] as any;
    const field = (await ctx.petitions.loadField(fieldId))!;

    validateReplyValue(field, value, info, argName);
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

    validateReplyValue(field, value, info, argName);
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

function validateReplyValue(
  field: PetitionField,
  reply: any,
  info: GraphQLResolveInfo,
  argName: string
) {
  switch (field.type) {
    case "NUMBER": {
      if (typeof reply !== "number" || Number.isNaN(reply)) {
        throw new InvalidReplyError(info, argName, "Reply must be of type number.", {
          subcode: "INVALID_TYPE_ERROR",
        });
      }
      const options = field.options;
      const min = (options.range.min as number) ?? -Infinity;
      const max = (options.range.max as number) ?? Infinity;
      if (reply > max || reply < min) {
        throw new InvalidReplyError(info, argName, `Reply must be in range [${min}, ${max}].`, {
          subcode: "OUT_OF_RANGE_ERROR",
        });
      }
      break;
    }
    case "SELECT": {
      if (typeof reply !== "string") {
        throw new InvalidReplyError(info, argName, "Reply must be of type string.", {
          subcode: "INVALID_TYPE_ERROR",
        });
      }
      const options = field.options.values as Maybe<string[]>;
      if (!options?.includes(reply)) {
        throw new InvalidReplyError(
          info,
          argName,
          `Reply must be one of [${(options ?? []).map((opt) => `"${opt}"`).join(", ")}].`,
          { subcode: "UNKNOWN_OPTION_ERROR" }
        );
      }
      break;
    }
    case "DATE": {
      if (typeof reply !== "string") {
        throw new InvalidReplyError(info, argName, "Reply must be of type string.", {
          subcode: "INVALID_TYPE_ERROR",
        });
      }
      if (!isValidDate(reply)) {
        throw new InvalidReplyError(
          info,
          argName,
          "Reply is not a valid date with YYYY-MM-DD format.",
          { subcode: "INVALID_VALUE_ERROR" }
        );
      }
      break;
    }
    case "TEXT":
    case "SHORT_TEXT": {
      if (typeof reply !== "string") {
        throw new InvalidReplyError(info, argName, "Reply must be of type string.", {
          subcode: "INVALID_TYPE_ERROR",
        });
      }
      const maxLength = (field.options.maxLength as Maybe<number>) ?? Infinity;
      if (reply.length > maxLength) {
        throw new InvalidReplyError(
          info,
          argName,
          `Reply exceeds max length allowed of ${maxLength} chars.`,
          { subcode: "MAX_LENGTH_EXCEEDED_ERROR" }
        );
      }
      break;
    }
    case "PHONE": {
      if (typeof reply !== "string") {
        throw new InvalidReplyError(info, argName, "Value must be a string", {
          subcode: "INVALID_TYPE_ERROR",
        });
      }
      if (!isPossiblePhoneNumber(reply)) {
        throw new InvalidReplyError(
          info,
          argName,
          `Value must be a valid phone number in e164 format`,
          { subcode: "INVALID_PHONE_NUMBER" }
        );
      }
      break;
    }
    case "CHECKBOX": {
      if (
        !Array.isArray(reply) ||
        !reply.every((r) => typeof r === "string") ||
        reply.length === 0
      ) {
        throw new InvalidReplyError(
          info,
          argName,
          "Reply must be an array of strings with at least one value.",
          { subcode: "INVALID_TYPE_ERROR" }
        );
      }

      const { type: subtype, min, max } = field.options.limit;
      if (subtype === "RADIO" && reply.length > 1) {
        throw new InvalidReplyError(info, argName, "Reply must contain exactly 1 choice.", {
          subcode: "INVALID_VALUE_ERROR",
        });
      } else if (subtype === "EXACT" && (reply.length > max || reply.length < min)) {
        throw new InvalidReplyError(info, argName, `Reply must contain exactly ${min} choice(s).`, {
          subcode: "INVALID_VALUE_ERROR",
        });
      } else if (subtype === "RANGE" && (reply.length > max || reply.length < min)) {
        throw new InvalidReplyError(
          info,
          argName,
          `Reply must contain between ${min} and ${max} choices.`,
          { subcode: "INVALID_VALUE_ERROR" }
        );
      }

      const differences = difference(reply, field.options.values);
      if (differences.length !== 0) {
        throw new InvalidReplyError(
          info,
          argName,
          `Reply must be some of [${(field.options.values ?? [])
            .map((opt: string) => `'${opt}'`)
            .join(", ")}].`,
          { subcode: "UNKNOWN_OPTION_ERROR" }
        );
      }
      break;
    }
    case "DYNAMIC_SELECT": {
      console.log(reply);
      if (!Array.isArray(reply)) {
        throw new InvalidReplyError(
          info,
          argName,
          "Reply must be an array with the selected options.",
          {
            subcode: "INVALID_TYPE_ERROR",
          }
        );
      }

      const labels = field.options.labels as string[];
      let values = field.options.values as string[] | DynamicSelectOption[];
      if (reply.length > labels.length) {
        throw new InvalidReplyError(
          info,
          argName,
          `Reply must be an array of length ${labels.length}.`,
          { subcode: "INVALID_VALUE_ERROR" }
        );
      }
      for (let level = 0; level < labels.length; level++) {
        if (reply[level]?.[0] !== labels[level]) {
          throw new InvalidReplyError(
            info,
            argName,
            `Expected '${labels[level]}' as label, received '${reply[level]?.[0]}'.`,
            { subcode: "INVALID_VALUE_ERROR" }
          );
        }
        if (reply[level]?.[1] === null) {
          if (!reply.slice(level + 1).every(([, value]) => value === null)) {
            throw new InvalidReplyError(
              info,
              argName,
              `A partial reply must contain null values starting from index ${level}.`,
              { subcode: "INVALID_VALUE_ERROR" }
            );
          }
        } else if (level === labels.length - 1) {
          if (!(values as string[]).includes(reply[level][1]!)) {
            throw new InvalidReplyError(
              info,
              argName,
              `Reply for label '${reply[level][0]}' must be one of [${(values as string[])
                .map((opt) => `'${opt}'`)
                .join(", ")}], received '${reply[level][1]}'.`,
              { subcode: "UNKNOWN_OPTION_ERROR" }
            );
          }
        } else {
          if (!(values as DynamicSelectOption[]).some(([value]) => value === reply[level][1])) {
            throw new InvalidReplyError(
              info,
              argName,
              `Reply for label '${reply[level][0]}' must be one of [${(
                values as DynamicSelectOption[]
              )
                .map(([opt]) => `'${opt}'`)
                .join(", ")}], received '${reply[level][1]}'.`,
              { subcode: "UNKNOWN_OPTION_ERROR" }
            );
          }
          values =
            (values as DynamicSelectOption[]).find(([value]) => value === reply[level][1])?.[1] ??
            [];
        }
      }
      break;
    }
    default:
      break;
  }
}
