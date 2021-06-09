import { PetitionField } from "../../db/__types";
import { DynamicSelectOption } from "../helpers/parseDynamicSelectValues";

export function validateDynamicSelectReplyValues(
  field: PetitionField,
  reply: (string | null)[][]
) {
  const levels = field.options.labels.length;
  const labels = field.options.labels as string[];
  let values = field.options.values as string[] | DynamicSelectOption[];
  for (let level = 0; level < levels; level++) {
    if (reply[level][0] !== labels[level]) {
      throw new Error(`Invalid label at level ${level}`);
    }
    if (reply[level][1] === null) {
      if (!reply.slice(level + 1).every(([, value]) => value === null)) {
        throw new Error("Invalid values after null");
      }
    } else if (level === levels - 1) {
      if (!(values as unknown as string[]).includes(reply[level][1]!)) {
        throw new Error(`Invalid value at level ${level}`);
      }
    } else {
      if (
        !(values as DynamicSelectOption[]).some(
          ([value]) => value === reply[level][1]
        )
      ) {
        throw new Error(`Invalid value at level ${level}`);
      }
      values =
        (values as DynamicSelectOption[]).find(
          ([value]) => value === reply[level][1]
        )?.[1] ?? [];
    }
  }
}

export function validateCheckboxReplyValues(
  field: PetitionField,
  values: string[]
) {
  const valuesSet = new Set(field.options.values);

  const mixedSet = new Set([...values, ...field.options.values]);

  if (mixedSet.size != valuesSet.size) {
    throw new Error(`Invalid values`);
  }
}
