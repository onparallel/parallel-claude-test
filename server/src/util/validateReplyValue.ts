import { isPossiblePhoneNumber } from "libphonenumber-js";
import { difference } from "remeda";
import { PetitionField } from "../db/__types";
import { DynamicSelectOption } from "../graphql/helpers/parseDynamicSelectValues";
import { Maybe } from "./types";
import { isValidDate } from "./validators";

export function validateReplyValue(field: PetitionField, reply: any) {
  switch (field.type) {
    case "NUMBER": {
      if (typeof reply !== "number" || Number.isNaN(reply)) {
        throw { code: "INVALID_TYPE_ERROR", message: "Reply must be of type number." };
      }
      const options = field.options;
      const min = (options.range.min as number) ?? -Infinity;
      const max = (options.range.max as number) ?? Infinity;
      if (reply > max || reply < min) {
        throw { code: "OUT_OF_RANGE_ERROR", message: `Reply must be in range [${min}, ${max}].` };
      }
      break;
    }
    case "SELECT": {
      if (typeof reply !== "string") {
        throw { code: "INVALID_TYPE_ERROR", message: "Reply must be of type string." };
      }
      const options = field.options.values as Maybe<string[]>;
      if (!options?.includes(reply)) {
        throw {
          code: "UNKNOWN_OPTION_ERROR",
          message: `Reply must be one of [${(options ?? []).map((opt) => `"${opt}"`).join(", ")}].`,
        };
      }
      break;
    }
    case "DATE": {
      if (typeof reply !== "string") {
        throw { code: "INVALID_TYPE_ERROR", message: "Reply must be of type string." };
      }
      if (!isValidDate(reply)) {
        throw {
          code: "INVALID_VALUE_ERROR",
          message: "Reply is not a valid date with YYYY-MM-DD format.",
        };
      }
      break;
    }
    case "TEXT":
    case "SHORT_TEXT": {
      if (typeof reply !== "string") {
        throw { code: "INVALID_TYPE_ERROR", message: "Reply must be of type string." };
      }
      const maxLength = (field.options.maxLength as Maybe<number>) ?? Infinity;
      if (reply.length > maxLength) {
        throw {
          code: "MAX_LENGTH_EXCEEDED_ERROR",
          message: "Reply exceeds max length allowed of ${maxLength} chars.",
        };
      }
      break;
    }
    case "PHONE": {
      if (typeof reply !== "string") {
        throw { code: "INVALID_TYPE_ERROR", message: "Reply must be of type string." };
      }
      if (!isPossiblePhoneNumber(reply)) {
        throw {
          code: "INVALID_PHONE_NUMBER",
          message: "Reply must be a valid phone number in e164 format",
        };
      }
      break;
    }
    case "CHECKBOX": {
      if (
        !Array.isArray(reply) ||
        !reply.every((r) => typeof r === "string") ||
        reply.length === 0
      ) {
        throw {
          code: "INVALID_TYPE_ERROR",
          message: "Reply must be an array of strings with at least one value.",
        };
      }

      const { type: subtype, min, max } = field.options.limit;
      if (subtype === "RADIO" && reply.length > 1) {
        throw { code: "INVALID_VALUE_ERROR", message: "Reply must contain exactly 1 choice." };
      } else if (subtype === "EXACT" && (reply.length > max || reply.length < min)) {
        throw {
          code: "INVALID_VALUE_ERROR",
          message: `Reply must contain exactly ${min} choice(s).`,
        };
      } else if (subtype === "RANGE" && (reply.length > max || reply.length < min)) {
        throw {
          code: "INVALID_VALUE_ERROR",
          message: `Reply must contain between ${min} and ${max} choices.`,
        };
      }

      const differences = difference(reply, field.options.values);
      if (differences.length !== 0) {
        throw {
          code: "UNKNOWN_OPTION_ERROR",
          message: `Reply must be some of [${(field.options.values ?? [])
            .map((opt: string) => `'${opt}'`)
            .join(", ")}].`,
        };
      }
      break;
    }
    case "DYNAMIC_SELECT": {
      if (!Array.isArray(reply)) {
        throw {
          code: "INVALID_TYPE_ERROR",
          message: "Reply must be an array with the selected options.",
        };
      }

      const labels = field.options.labels as string[];
      let values = field.options.values as string[] | DynamicSelectOption[];
      if (reply.length > labels.length) {
        throw {
          code: "INVALID_VALUE_ERROR",
          message: `Reply must be an array of length ${labels.length}.`,
        };
      }
      for (let level = 0; level < labels.length; level++) {
        if (reply[level]?.[0] !== labels[level]) {
          throw {
            code: "INVALID_VALUE_ERROR",
            message: `Expected '${labels[level]}' as label, received '${reply[level]?.[0]}'.`,
          };
        }
        if (reply[level]?.[1] === null) {
          if (!reply.slice(level + 1).every(([, value]) => value === null)) {
            throw {
              code: "INVALID_VALUE_ERROR",
              message: `A partial reply must contain null values starting from index ${level}.`,
            };
          }
        } else if (level === labels.length - 1) {
          if (!(values as string[]).includes(reply[level][1]!)) {
            throw {
              code: "UNKNOWN_OPTION_ERROR",
              message: `Reply for label '${reply[level][0]}' must be one of [${(values as string[])
                .map((opt) => `'${opt}'`)
                .join(", ")}], received '${reply[level][1]}'.`,
            };
          }
        } else {
          if (!(values as DynamicSelectOption[]).some(([value]) => value === reply[level][1])) {
            throw {
              code: "UNKNOWN_OPTION_ERROR",
              message: `Reply for label '${reply[level][0]}' must be one of [${(
                values as DynamicSelectOption[]
              )
                .map(([opt]) => `'${opt}'`)
                .join(", ")}], received '${reply[level][1]}'.`,
            };
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
