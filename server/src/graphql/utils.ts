import { difference } from "remeda";
import { PetitionField } from "../db/__types";
import { DynamicSelectOption } from "./helpers/parseDynamicSelectValues";

export function validateDynamicSelectReplyValues(field: PetitionField, reply: (string | null)[][]) {
  const levels = field.options.labels.length;
  const labels = field.options.labels as string[];
  let values = field.options.values as string[] | DynamicSelectOption[];
  if (reply.length > levels) {
    throw new Error("INVALID_VALUE_ERROR");
  }
  for (let level = 0; level < levels; level++) {
    if (reply[level][0] !== labels[level]) {
      throw new Error("INVALID_VALUE_ERROR");
    }
    if (reply[level][1] === null) {
      if (!reply.slice(level + 1).every(([, value]) => value === null)) {
        throw new Error("INVALID_VALUE_ERROR");
      }
    } else if (level === levels - 1) {
      if (!(values as unknown as string[]).includes(reply[level][1]!)) {
        throw new Error("UNKNOWN_OPTION_ERROR");
      }
    } else {
      if (!(values as DynamicSelectOption[]).some(([value]) => value === reply[level][1])) {
        throw new Error("UNKNOWN_OPTION_ERROR");
      }
      values =
        (values as DynamicSelectOption[]).find(([value]) => value === reply[level][1])?.[1] ?? [];
    }
  }
}

export function validateCheckboxReplyValues(field: PetitionField, values: string[]) {
  const { type: subtype, min, max } = field.options.limit;

  if (subtype === "RADIO" && values.length > 1) {
    throw new Error("INVALID_VALUE_ERROR");
  }

  if (
    (subtype === "EXACT" || subtype === "RANGE") &&
    (values.length > max || values.length < min)
  ) {
    throw new Error("OUT_OF_RANGE_ERROR");
  }

  if (difference(values, field.options.values).length !== 0) {
    throw new Error("INVALID_VALUE_ERROR");
  }
}
