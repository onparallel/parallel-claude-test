import { gql } from "@apollo/client";
import {
  completedFieldReplies_PetitionFieldFragment,
  completedFieldReplies_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";

type PetitionFieldSelection =
  | completedFieldReplies_PetitionFieldFragment
  | completedFieldReplies_PublicPetitionFieldFragment;

// ALERT: Same logic in completedFieldReplies in server side
/** returns the field replies that are fully completed */
// @usePreviewReplies is used only in client side to work with preview replies
export function completedFieldReplies(field: PetitionFieldSelection, usePreviewReplies?: boolean) {
  const replies =
    usePreviewReplies && field.__typename === "PetitionField"
      ? field.previewReplies
      : field.replies;
  if (replies.every((r) => r.isAnonymized)) {
    return replies;
  }
  switch (field.type) {
    case "DYNAMIC_SELECT":
      return replies.filter((reply) =>
        reply.content.value.every(([, value]: [string, string | null]) => !!value),
      );
    case "CHECKBOX":
      return replies.filter((reply) => {
        if (field.options.limit.type === "EXACT") {
          return reply.content.value.length === field.options.limit.max;
        } else {
          return reply.content.value.length >= field.options.limit.min;
        }
      });
    case "FILE_UPLOAD":
    case "ES_TAX_DOCUMENTS":
    case "DOW_JONES_KYC":
      return replies.filter((reply) => reply.content.uploadComplete);
    case "FIELD_GROUP":
      // we don't verify that every field of a FIELD_GROUP reply is completed
      return replies;
    default:
      return replies;
  }
}

completedFieldReplies.fragments = {
  get PetitionField() {
    return gql`
      fragment completedFieldReplies_PetitionField on PetitionField {
        type
        options
        previewReplies @client {
          ...completedFieldReplies_PetitionFieldReply
        }
        replies {
          ...completedFieldReplies_PetitionFieldReply
        }
      }
      ${this.PetitionFieldReply}
    `;
  },
  get PetitionFieldReply() {
    return gql`
      fragment completedFieldReplies_PetitionFieldReply on PetitionFieldReply {
        content
        isAnonymized
      }
    `;
  },
  get PublicPetitionField() {
    return gql`
      fragment completedFieldReplies_PublicPetitionField on PublicPetitionField {
        type
        options
        replies {
          ...completedFieldReplies_PublicPetitionFieldReply
        }
      }
      ${this.PublicPetitionFieldReply}
    `;
  },
  get PublicPetitionFieldReply() {
    return gql`
      fragment completedFieldReplies_PublicPetitionFieldReply on PublicPetitionFieldReply {
        content
        isAnonymized
      }
    `;
  },
};
