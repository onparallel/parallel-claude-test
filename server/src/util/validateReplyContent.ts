import { isPossiblePhoneNumber } from "libphonenumber-js";
import { difference, isDefined } from "remeda";
import { PetitionField } from "../db/__types";
import { DynamicSelectOption } from "../graphql/helpers/parseDynamicSelectValues";
import { Maybe } from "./types";
import { isValidDate, isValidDatetime, isValidTimezone } from "./time";
import { isGlobalId } from "./globalId";

export function validateReplyContent(field: PetitionField, content: any) {
  switch (field.type) {
    case "NUMBER": {
      if (
        !("value" in content) ||
        typeof content.value !== "number" ||
        Number.isNaN(content.value)
      ) {
        throw { code: "INVALID_TYPE_ERROR", message: "Reply must be of type number." };
      }
      const options = field.options;
      const min = (options.range?.min as number) ?? -Infinity;
      const max = (options.range?.max as number) ?? Infinity;
      if (content.value > max || content.value < min) {
        throw { code: "OUT_OF_RANGE_ERROR", message: `Reply must be in range [${min}, ${max}].` };
      }
      break;
    }
    case "SELECT": {
      if (!("value" in content) || typeof content.value !== "string") {
        throw { code: "INVALID_TYPE_ERROR", message: "Reply must be of type string." };
      }
      const options = field.options.values as Maybe<string[]>;
      if (!options?.includes(content.value)) {
        throw {
          code: "UNKNOWN_OPTION_ERROR",
          message: `Reply must be one of [${(options ?? []).map((opt) => `"${opt}"`).join(", ")}].`,
        };
      }
      break;
    }
    case "DATE": {
      if (!("value" in content) || typeof content.value !== "string") {
        throw { code: "INVALID_TYPE_ERROR", message: "Reply must be of type string." };
      }
      if (!isValidDate(content.value)) {
        throw {
          code: "INVALID_VALUE_ERROR",
          message: "Reply is not a valid date with YYYY-MM-DD format.",
        };
      }
      break;
    }
    case "DATE_TIME": {
      if (typeof content !== "object") {
        throw { code: "INVALID_TYPE_ERROR", message: "Reply must be of type object." };
      }

      if (!isValidDatetime(content.datetime)) {
        throw {
          code: "INVALID_VALUE_ERROR",
          message: "Reply has not a valid date with YYYY-MM-DDTHH:mm format.",
        };
      }

      if (!isValidTimezone(content.timezone)) {
        throw {
          code: "INVALID_VALUE_ERROR",
          message: "Reply has not a valid timezone.",
        };
      }
      break;
    }
    case "TEXT":
    case "SHORT_TEXT": {
      if (!("value" in content) || typeof content.value !== "string") {
        throw { code: "INVALID_TYPE_ERROR", message: "Reply must be of type string." };
      }
      const maxLength = (field.options.maxLength as Maybe<number>) ?? Infinity;
      if (content.value.length > maxLength) {
        throw {
          code: "MAX_LENGTH_EXCEEDED_ERROR",
          message: "Reply exceeds max length allowed of ${maxLength} chars.",
        };
      }
      break;
    }
    case "PHONE": {
      if (!("value" in content) || typeof content.value !== "string") {
        throw { code: "INVALID_TYPE_ERROR", message: "Reply must be of type string." };
      }
      if (!isPossiblePhoneNumber(content.value)) {
        throw {
          code: "INVALID_PHONE_NUMBER",
          message: "Reply must be a valid phone number in e164 format",
        };
      }
      break;
    }
    case "CHECKBOX": {
      if (
        !("value" in content) ||
        !Array.isArray(content.value) ||
        !(content.value as any[]).every((r) => typeof r === "string") ||
        content.value.length === 0
      ) {
        throw {
          code: "INVALID_TYPE_ERROR",
          message: "Reply must be an array of strings with at least one value.",
        };
      }

      const { type: subtype, min, max } = field.options.limit;
      if (subtype === "RADIO" && content.value.length > 1) {
        throw { code: "INVALID_VALUE_ERROR", message: "Reply must contain exactly 1 choice." };
      } else if (
        subtype === "EXACT" &&
        (content.value.length > max || content.value.length < min)
      ) {
        throw {
          code: "INVALID_VALUE_ERROR",
          message: `Reply must contain exactly ${min} choice(s).`,
        };
      } else if (
        subtype === "RANGE" &&
        (content.value.length > max || content.value.length < min)
      ) {
        throw {
          code: "INVALID_VALUE_ERROR",
          message: `Reply must contain between ${min} and ${max} choices.`,
        };
      }

      const differences = difference(content.value, field.options.values);
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
      if (!("value" in content) || !Array.isArray(content.value)) {
        throw {
          code: "INVALID_TYPE_ERROR",
          message: "Reply must be an array with the selected options.",
        };
      }

      const labels = field.options.labels as string[];
      let values = field.options.values as string[] | DynamicSelectOption[];
      if (content.value.length > labels.length) {
        throw {
          code: "INVALID_VALUE_ERROR",
          message: `Reply must be an array of length ${labels.length}.`,
        };
      }
      for (let level = 0; level < labels.length; level++) {
        if (content.value[level]?.[0] !== labels[level]) {
          throw {
            code: "INVALID_VALUE_ERROR",
            message: `Expected '${labels[level]}' as label, received '${content.value[level]?.[0]}'.`,
          };
        }
        if (content.value[level]?.[1] === null) {
          if (
            !(content.value as string[][]).slice(level + 1).every(([, value]) => value === null)
          ) {
            throw {
              code: "INVALID_VALUE_ERROR",
              message: `A partial reply must contain null values starting from index ${level}.`,
            };
          }
        } else if (level === labels.length - 1) {
          if (!(values as string[]).includes(content.value[level][1]!)) {
            throw {
              code: "UNKNOWN_OPTION_ERROR",
              message: `Reply for label '${content.value[level][0]}' must be one of [${(
                values as string[]
              )
                .map((opt) => `'${opt}'`)
                .join(", ")}], received '${content.value[level][1]}'.`,
            };
          }
        } else {
          if (
            !(values as DynamicSelectOption[]).some(([value]) => value === content.value[level][1])
          ) {
            throw {
              code: "UNKNOWN_OPTION_ERROR",
              message: `Reply for label '${content.value[level][0]}' must be one of [${(
                values as DynamicSelectOption[]
              )
                .map(([opt]) => `'${opt}'`)
                .join(", ")}], received '${content.value[level][1]}'.`,
            };
          }
          values =
            (values as DynamicSelectOption[]).find(
              ([value]) => value === content.value[level][1]
            )?.[1] ?? [];
        }
      }
      break;
    }
    case "FILE_UPLOAD":
    case "DOW_JONES_KYC":
    case "ES_TAX_DOCUMENTS": {
      if (typeof content !== "object") {
        throw { code: "INVALID_TYPE_ERROR", message: "Reply must be of type object." };
      }
      if (
        !("petitionFieldReplyId" in content) ||
        !isDefined(content.petitionFieldReplyId) ||
        !isGlobalId(content.petitionFieldReplyId, "PetitionFieldReply")
      ) {
        throw {
          code: "INVALID_VALUE_ERROR",
          message: "Reply must contain a valid PetitionFieldReply id.",
        };
      }

      break;
    }
    default:
      throw new Error(`Invalid field type '${field.type}'.`);
  }
}
