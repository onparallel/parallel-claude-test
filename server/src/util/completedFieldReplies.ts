import { PetitionFieldType } from "../db/__types";

type PartialField = {
  type: PetitionFieldType;
  options: any;
  replies: { content: any; anonymized_at: Date | null }[];
};

// ALERT: Same logic in completedFieldReplies in client side
/** returns the field replies that are fully completed */
export function completedFieldReplies(field: PartialField) {
  if (field.replies.every((r) => r.anonymized_at !== null)) {
    return field.replies;
  }
  switch (field.type) {
    case "DYNAMIC_SELECT":
      return field.replies.filter((reply) =>
        reply.content.value.every(([, value]: [string, string | null]) => !!value)
      );
    case "CHECKBOX":
      return field.replies.filter((reply) => {
        if (field.options.limit.type === "EXACT") {
          return reply.content.value.length === field.options.limit.max;
        } else {
          return reply.content.value.length >= field.options.limit.min;
        }
      });
    case "FILE_UPLOAD":
    case "ES_TAX_DOCUMENTS":
      return field.replies.filter((reply) => reply.content.uploadComplete);

    default:
      return field.replies;
  }
}
