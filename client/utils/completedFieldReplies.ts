import { PetitionFieldType } from "@parallel/graphql/__types";

type PartialField = {
  type: PetitionFieldType;
  options: any;
  replies: { content: any }[];
};

// ALERT: Same logic in completedFieldReplies in client side
/** returns the field replies that are fully completed */
export function completedFieldReplies<T extends PartialField>(field: T) {
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
