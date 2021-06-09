import { PetitionFieldType } from "@parallel/graphql/__types";

type PartialField = {
  type: PetitionFieldType;
  options: any;
  replies: { content: any }[];
};

/** returns the field replies that are fully completed */
export function completedFieldReplies<T extends PartialField>(field: T) {
  switch (field.type) {
    case "DYNAMIC_SELECT":
      return field.replies.filter((reply) =>
        reply.content.columns.every(
          ([, value]: [string, string | null]) => !!value
        )
      );
    case "CHECKBOX":
      return field.replies.filter((reply) => {
        if (field.options.limit.type === "EXACT") {
          return reply.content.choices.length == field.options.limit.max;
        } else {
          return reply.content.choices.length >= field.options.limit.min;
        }
      });

    default:
      return field.replies;
  }
}
