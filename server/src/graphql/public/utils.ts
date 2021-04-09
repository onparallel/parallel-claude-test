import { GraphQLResolveInfo } from "graphql";
import { PetitionField } from "../../db/__types";
import { ArgValidationError } from "../helpers/errors";

export function validateDynamicSelectReplyValues(
  field: PetitionField,
  reply: Array<Array<string | null>>,
  info: GraphQLResolveInfo
) {
  const labels = field.options.labels as string[];
  let levelValues = field.options.values as any;
  for (let level = 0; level < reply.length; level++) {
    const [label, value] = reply[level];
    if (
      !label ||
      label !== labels[level] ||
      !value ||
      !levelValues
        .map((v: string | string[]) => (Array.isArray(v) ? v[0] : v))
        .includes(value)
    ) {
      throw new ArgValidationError(info, "reply", "Invalid option");
    } else {
      levelValues = levelValues.find(([v]: string[]) => v === value)?.[1];
    }
  }
}
