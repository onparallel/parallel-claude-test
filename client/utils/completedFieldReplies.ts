import { gql } from "@apollo/client";
import {
  completedFieldReplies_PetitionFieldFragment,
  completedFieldReplies_PublicPetitionFieldFragment,
  PetitionFieldType,
} from "@parallel/graphql/__types";

type PartialField =
  | completedFieldReplies_PetitionFieldFragment
  | completedFieldReplies_PublicPetitionFieldFragment;

type Field = {
  type: PetitionFieldType;
  options: any;
  replies: { content: any; isAnonymized: boolean }[];
};

// ALERT: Same logic in completedFieldReplies in client side
/** returns the field replies that are fully completed */
export function completedFieldReplies(field: PartialField) {
  const f = field as Field;
  if (f.replies.every((r) => r.isAnonymized)) {
    return f.replies;
  }
  switch (f.type) {
    case "DYNAMIC_SELECT":
      return f.replies.filter((reply) =>
        reply.content.value.every(([, value]: [string, string | null]) => !!value)
      );
    case "CHECKBOX":
      return f.replies.filter((reply) => {
        if (f.options.limit.type === "EXACT") {
          return reply.content.value.length === f.options.limit.max;
        } else {
          return reply.content.value.length >= f.options.limit.min;
        }
      });
    case "FILE_UPLOAD":
    case "ES_TAX_DOCUMENTS":
      return f.replies.filter((reply) => reply.content.uploadComplete);

    default:
      return f.replies;
  }
}

completedFieldReplies.fragments = {
  PetitionField: gql`
    fragment completedFieldReplies_PetitionField on PetitionField {
      type
      options
      replies {
        content
        isAnonymized
      }
    }
  `,
  PublicPetitionField: gql`
    fragment completedFieldReplies_PublicPetitionField on PublicPetitionField {
      type
      options
      replies {
        content
        isAnonymized
      }
    }
  `,
};
