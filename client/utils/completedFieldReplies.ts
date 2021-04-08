import { PetitionField, PetitionFieldReply } from "@parallel/graphql/__types";

type PartialField = Pick<PetitionField, "type" | "options"> & {
  replies: Pick<PetitionFieldReply, "content">[];
};

/** returns the field replies that are fully completed */
export function completedFieldReplies<T extends PartialField>(field: T) {
  switch (field.type) {
    case "DYNAMIC_SELECT":
      return field.replies.filter(
        (reply) => reply.content.columns.length === reply.content.labels.length
      );

    default:
      return field.replies;
  }
}
