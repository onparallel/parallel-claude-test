import { isPossiblePhoneNumber } from "libphonenumber-js";
import { difference, isDefined } from "remeda";
import { PetitionField } from "../db/__types";
import { selectOptionsValuesAndLabels } from "../db/helpers/fieldOptions";
import { DynamicSelectOption } from "../graphql/helpers/parseDynamicSelectValues";
import { isGlobalId } from "./globalId";
import { isValidDate, isValidDatetime, isValidTimezone } from "./time";
import { Maybe } from "./types";
import { validateShortTextFormat } from "./validateShortTextFormat";

export class ValidateReplyContentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function validateReplyContent(
  field: Pick<PetitionField, "type" | "options">,
  content: any,
) {
  switch (field.type) {
    case "NUMBER": {
      if (
        !("value" in content) ||
        typeof content.value !== "number" ||
        Number.isNaN(content.value)
      ) {
        throw new ValidateReplyContentError("INVALID_TYPE_ERROR", "Reply must be of type number.");
      }
      const options = field.options;
      const min = (options.range?.min as number) ?? -Infinity;
      const max = (options.range?.max as number) ?? Infinity;
      if (content.value > max || content.value < min) {
        throw new ValidateReplyContentError(
          "OUT_OF_RANGE_ERROR",
          `Reply must be in range [${min}, ${max}].`,
        );
      }
      break;
    }
    case "SELECT": {
      if (!("value" in content) || typeof content.value !== "string") {
        throw new ValidateReplyContentError("INVALID_TYPE_ERROR", "Reply must be of type string.");
      }
      const options = (await selectOptionsValuesAndLabels(field.options)).values;
      if (!options.includes(content.value)) {
        throw new ValidateReplyContentError(
          "UNKNOWN_OPTION_ERROR",
          `Reply must be one of [${(options ?? []).map((opt) => `'${opt}'`).join(", ")}].`,
        );
      }
      break;
    }
    case "DATE": {
      if (!("value" in content) || typeof content.value !== "string") {
        throw new ValidateReplyContentError("INVALID_TYPE_ERROR", "Reply must be of type string.");
      }
      if (!isValidDate(content.value)) {
        throw new ValidateReplyContentError(
          "INVALID_VALUE_ERROR",
          "Reply is not a valid date with YYYY-MM-DD format.",
        );
      }
      break;
    }
    case "DATE_TIME": {
      if (typeof content !== "object") {
        throw new ValidateReplyContentError("INVALID_TYPE_ERROR", "Reply must be of type object.");
      }
      if (!("datetime" in content)) {
        throw new ValidateReplyContentError(
          "INVALID_TYPE_ERROR",
          'Reply is missing a "datetime" key.',
        );
      }
      if (!("timezone" in content)) {
        throw new ValidateReplyContentError(
          "INVALID_TYPE_ERROR",
          'Reply is missing a "timezone" key.',
        );
      }

      if (!isValidDatetime(content.datetime)) {
        throw new ValidateReplyContentError(
          "INVALID_VALUE_ERROR",
          `${content.datetime} is not a valid date with YYYY-MM-DDTHH:mm format.`,
        );
      }

      if (!isValidTimezone(content.timezone)) {
        throw new ValidateReplyContentError(
          "INVALID_VALUE_ERROR",
          `${content.timezone} is not have a valid timezone.`,
        );
      }
      break;
    }
    case "TEXT":
    case "SHORT_TEXT": {
      if (!("value" in content) || typeof content.value !== "string") {
        throw new ValidateReplyContentError("INVALID_TYPE_ERROR", "Reply must be of type string.");
      }
      const maxLength = (field.options.maxLength as Maybe<number>) ?? Infinity;
      if (content.value.length > maxLength) {
        throw new ValidateReplyContentError(
          "MAX_LENGTH_EXCEEDED_ERROR",
          `Reply exceeds max length allowed of ${maxLength} chars.`,
        );
      }
      if (isDefined(field.options.format)) {
        if (!(await validateShortTextFormat(content.value, field.options.format))) {
          throw new ValidateReplyContentError(
            "INVALID_FORMAT",
            `Reply is not valid according to format ${field.options.format}.`,
          );
        }
      }
      break;
    }
    case "PHONE": {
      if (!("value" in content) || typeof content.value !== "string") {
        throw new ValidateReplyContentError("INVALID_TYPE_ERROR", "Reply must be of type string.");
      }
      if (!isPossiblePhoneNumber(content.value)) {
        throw new ValidateReplyContentError(
          "INVALID_PHONE_NUMBER",
          `${content.value} is not a valid phone number in e164 format`,
        );
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
        throw new ValidateReplyContentError(
          "INVALID_TYPE_ERROR",
          "Reply must be an array of strings with at least one value.",
        );
      }

      const { type: subtype, min, max } = field.options.limit;
      if (subtype === "RADIO" && content.value.length !== 1) {
        throw new ValidateReplyContentError(
          "INVALID_VALUE_ERROR",
          "Reply must contain exactly 1 choice.",
        );
      } else if (
        subtype === "EXACT" &&
        (content.value.length > max || content.value.length < min)
      ) {
        throw new ValidateReplyContentError(
          "INVALID_VALUE_ERROR",
          `Reply must contain exactly ${min} choice(s).`,
        );
      } else if (
        subtype === "RANGE" &&
        (content.value.length > max || content.value.length < min)
      ) {
        throw new ValidateReplyContentError(
          "INVALID_VALUE_ERROR",
          `Reply must contain between ${min} and ${max} choices.`,
        );
      }

      const differences = difference(content.value, field.options.values);
      if (differences.length !== 0) {
        throw new ValidateReplyContentError(
          "UNKNOWN_OPTION_ERROR",
          `Reply must be some of [${(field.options.values ?? [])
            .map((opt: string) => `'${opt}'`)
            .join(", ")}].`,
        );
      }
      break;
    }
    case "DYNAMIC_SELECT": {
      if (!("value" in content) || !Array.isArray(content.value)) {
        throw new ValidateReplyContentError(
          "INVALID_TYPE_ERROR",
          "Reply must be an array with the selected options.",
        );
      }

      const labels = field.options.labels as string[];
      let values = field.options.values as string[] | DynamicSelectOption[];
      if (content.value.length > labels.length) {
        throw new ValidateReplyContentError(
          "INVALID_VALUE_ERROR",
          `Reply must be an array of length ${labels.length}.`,
        );
      }
      for (let level = 0; level < labels.length; level++) {
        if (content.value[level]?.[0] !== labels[level]) {
          throw new ValidateReplyContentError(
            "INVALID_VALUE_ERROR",
            `Expected '${labels[level]}' as label, received '${content.value[level]?.[0]}'.`,
          );
        }
        if (content.value[level]?.[1] === null) {
          if (
            !(content.value as string[][]).slice(level + 1).every(([, value]) => value === null)
          ) {
            throw new ValidateReplyContentError(
              "INVALID_VALUE_ERROR",
              `A partial reply must contain null values starting from index ${level}.`,
            );
          }
        } else if (level === labels.length - 1) {
          if (!(values as string[]).includes(content.value[level][1]!)) {
            throw new ValidateReplyContentError(
              "UNKNOWN_OPTION_ERROR",
              `Reply for label '${content.value[level][0]}' must be one of [${(values as string[])
                .map((opt) => `'${opt}'`)
                .join(", ")}], received '${content.value[level][1]}'.`,
            );
          }
        } else {
          if (
            !(values as DynamicSelectOption[]).some(([value]) => value === content.value[level][1])
          ) {
            throw new ValidateReplyContentError(
              "UNKNOWN_OPTION_ERROR",
              `Reply for label '${content.value[level][0]}' must be one of [${(
                values as DynamicSelectOption[]
              )
                .map(([opt]) => `'${opt}'`)
                .join(", ")}], received '${content.value[level][1]}'.`,
            );
          }
          values =
            (values as DynamicSelectOption[]).find(
              ([value]) => value === content.value[level][1],
            )?.[1] ?? [];
        }
      }
      break;
    }
    case "FILE_UPLOAD":
    case "DOW_JONES_KYC":
    case "ES_TAX_DOCUMENTS": {
      if (typeof content !== "object") {
        throw new ValidateReplyContentError("INVALID_TYPE_ERROR", "Reply must be of type object.");
      }
      if (
        !("petitionFieldReplyId" in content) ||
        !isDefined(content.petitionFieldReplyId) ||
        !isGlobalId(content.petitionFieldReplyId, "PetitionFieldReply")
      ) {
        throw new ValidateReplyContentError(
          "INVALID_VALUE_ERROR",
          "Reply must contain a valid PetitionFieldReply id.",
        );
      }
      break;
    }
    case "FIELD_GROUP": {
      if (typeof content !== "object") {
        throw new ValidateReplyContentError("INVALID_TYPE_ERROR", "Reply must be of type object.");
      }
      if (Object.keys(content).length > 0) {
        throw new ValidateReplyContentError("INVALID_VALUE_ERROR", "Reply must be empty.");
      }
      break;
    }
    default:
      throw new Error(`Invalid field type '${field.type}'.`);
  }
}
