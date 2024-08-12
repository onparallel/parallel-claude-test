import { gql } from "@apollo/client";
import {
  PetitionField,
  PetitionFieldReply,
  PublicPetitionField,
  PublicPetitionFieldReply,
  completedFieldReplies_PetitionFieldFragment,
  completedFieldReplies_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { isDefined, zip } from "remeda";
import { FieldLogicResult } from "./fieldLogic/useFieldLogic";
import { ArrayUnionToUnion } from "./types";

type PetitionFieldSelection =
  | completedFieldReplies_PetitionFieldFragment
  | completedFieldReplies_PublicPetitionFieldFragment;

type PetitionFieldReplySelection = ArrayUnionToUnion<PetitionFieldSelection["replies"]>;

type PetitionFieldChildReplySelection = ArrayUnionToUnion<
  Exclude<ArrayUnionToUnion<PetitionFieldSelection["replies"]>["children"], null | undefined>
>;

// ALERT: Same logic in completedFieldReplies in server side
/** returns the field replies that are fully completed */
// @usePreviewReplies is used only in client side to work with preview replies
export function completedFieldReplies(
  field: PetitionFieldSelection,
  usePreviewReplies?: boolean,
  fieldLogic?: FieldLogicResult,
) {
  const replies =
    usePreviewReplies && field.__typename === "PetitionField"
      ? field.previewReplies
      : field.replies;
  if (replies.every((r) => r.isAnonymized)) {
    return replies;
  }
  switch (field.type) {
    case "FIELD_GROUP":
      if (isDefined(fieldLogic)) {
        return zip(replies as PetitionFieldReplySelection[], fieldLogic!.groupChildrenLogic!)
          .filter(([reply, childLogic]) =>
            zip(reply.children! as PetitionFieldChildReplySelection[], childLogic)
              .filter(([, { isVisible }]) => isVisible)
              .every(
                ([{ field, replies }]) =>
                  field.optional || _completedFieldReplies(field, replies).length > 0,
              ),
          )
          .map(([r]) => r);
      } else {
        return replies;
      }
    default:
      return _completedFieldReplies(field, replies);
  }
}

function _completedFieldReplies(
  field: Pick<PetitionField | PublicPetitionField, "type" | "options">,
  replies: Pick<PetitionFieldReply | PublicPetitionFieldReply, "content" | "isAnonymized">[],
) {
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
    case "ID_VERIFICATION":
    case "DOW_JONES_KYC":
      return replies.filter((reply) => reply.content.uploadComplete);
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
          children {
            field {
              type
              options
              optional
            }
            replies {
              ...completedFieldReplies_PetitionFieldReply
            }
          }
        }
        replies {
          ...completedFieldReplies_PetitionFieldReply
          children {
            field {
              type
              options
              optional
            }
            replies {
              ...completedFieldReplies_PetitionFieldReply
            }
          }
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
          children {
            field {
              type
              options
              optional
            }
            replies {
              ...completedFieldReplies_PublicPetitionFieldReply
            }
          }
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
