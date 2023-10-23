import { PetitionField, PetitionFieldReply } from "../db/__types";

interface PartialField extends Pick<PetitionField, "type" | "options"> {
  replies: Pick<PetitionFieldReply, "content" | "anonymized_at">[];
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
      return field.replies.filter((reply) => {
        if (field.options.limit.type === "EXACT") {
          return reply.content.value.length === field.options.limit.max;
        } else {
          return reply.content.value.length >= field.options.limit.min;
        }
      });
    case "FIELD_GROUP":
      // we don't verify that every field of a FIELD_GROUP reply is completed
      return field.replies;
    default:
      return field.replies;
  }
}
