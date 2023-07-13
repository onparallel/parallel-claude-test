import { gql } from "@apollo/client";
import {
  completedFieldReplies_PetitionFieldFragment,
  completedFieldReplies_PublicPetitionFieldFragment,
  PetitionFieldType,
} from "@parallel/graphql/__types";

type PartialField =
  | completedFieldReplies_PetitionFieldFragment
  | completedFieldReplies_PublicPetitionFieldFragment;

interface Field {
  type: PetitionFieldType;
  options: any;
  previewReplies: { content: any; isAnonymized: boolean }[];
  replies: { content: any; isAnonymized: boolean }[];
}

// ALERT: Same logic in completedFieldReplies in server side
/** returns the field replies that are fully completed */
// @usePreviewReplies is used only in client side to work with preview replies
export function completedFieldReplies(field: PartialField, usePreviewReplies?: boolean) {
  const f = field as Field;
  const replies = usePreviewReplies ? f.previewReplies : f.replies;
  if (replies.every((r) => r.isAnonymized)) {
    return replies;
  }
  switch (f.type) {
    case "DYNAMIC_SELECT":
      return replies.filter((reply) =>
        reply.content.value.every(([, value]: [string, string | null]) => !!value),
      );
    case "CHECKBOX":
      return replies.filter((reply) => {
        if (f.options.limit.type === "EXACT") {
          return reply.content.value.length === f.options.limit.max;
        } else {
          return reply.content.value.length >= f.options.limit.min;
        }
      });
    case "FILE_UPLOAD":
    case "ES_TAX_DOCUMENTS":
    case "DOW_JONES_KYC":
      return replies.filter((reply) => reply.content.uploadComplete);
    default:
      return replies;
  }
}

completedFieldReplies.fragments = {
  PetitionField: gql`
    fragment completedFieldReplies_PetitionField on PetitionField {
      type
      options
      previewReplies @client {
        content
        isAnonymized
      }
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
