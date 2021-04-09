import { PetitionFieldType } from "@parallel/graphql/__types";

type PartialField = {
  type: PetitionFieldType;
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

    default:
      return field.replies;
  }
}
