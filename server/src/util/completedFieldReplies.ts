import { PetitionFieldType } from "../db/__types";
import { PetitionFieldOptions } from "../services/PetitionFieldService";

interface PartialField {
  type: PetitionFieldType;
  options: any;
  replies: { content: any; anonymized_at: Date | null }[];
}

// ALERT: Same logic in completedFieldReplies in client side
/** returns the field replies that are fully completed */
export function completedFieldReplies(field: PartialField) {
  if (field.replies.every((r) => r.anonymized_at !== null)) {
    return field.replies;
  }
  switch (field.type) {
    case "DYNAMIC_SELECT":
      return field.replies.filter((reply) =>
        reply.content.value.every(([, value]: [string, string | null]) => !!value),
      );
    case "CHECKBOX":
      const options = field.options as PetitionFieldOptions["CHECKBOX"];
      return field.replies.filter((reply) => {
        if (options.limit?.type === "EXACT") {
          return reply.content.value.length === options.limit.max;
        } else {
          return !options.limit?.min || reply.content.value.length >= options.limit.min;
        }
      });
    case "FIELD_GROUP":
      // we don't verify that every field of a FIELD_GROUP reply is completed
      return field.replies;
    default:
      return field.replies;
  }
}
