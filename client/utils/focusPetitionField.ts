import { gql } from "@apollo/client";
import {
  focusPetitionField_PetitionFieldFragment,
  focusPetitionField_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";

type PetitionFieldSelection =
  | focusPetitionField_PetitionFieldFragment
  | focusPetitionField_PublicPetitionFieldFragment;

export function focusPetitionField({
  field,
  parentReplyId,
  usePreviewReplies,
  sufix,
}: {
  field: PetitionFieldSelection;
  parentReplyId?: string;
  usePreviewReplies?: boolean;
  sufix?: string;
}) {
  const replies =
    usePreviewReplies && field.__typename === "PetitionField"
      ? field.previewReplies.filter((r) => r.parent?.id === parentReplyId)
      : field.replies.filter((r) => r.parent?.id === parentReplyId);

  const focusFieldContainer = ["HEADING", "FIELD_GROUP"].includes(field.type);
  let id = "";
  if (focusFieldContainer || field.type === "CHECKBOX") {
    id = `field-${field.id}${parentReplyId ? `-${parentReplyId}` : ""}`;
  } else {
    id = `reply-${field.id}${parentReplyId ? `-${parentReplyId}` : ""}${
      replies[0]?.id ? `-${replies[0].id}` : "-new"
    }`;
  }

  if (field.type === "DYNAMIC_SELECT" && replies.length) {
    id += sufix ?? "-0";
  }

  const element =
    field.type === "CHECKBOX"
      ? (document.querySelector(`#${id} input`) as HTMLInputElement)
      : (document.getElementById(id) as HTMLInputElement);

  if (element) {
    smoothScrollIntoView(element, { block: "center", behavior: "smooth" });
    if (!focusFieldContainer) {
      element.focus();
      if (element.type === "text") {
        // setSelectionRange does not work on inputs that are not type="text" (e.g. email)
        element.setSelectionRange?.(element.value.length, element.value.length);
      }
    }
  }
}

focusPetitionField.fragments = {
  PetitionField: gql`
    fragment focusPetitionField_PetitionField on PetitionField {
      id
      type
      previewReplies @client {
        id
        parent {
          id
        }
      }
      replies {
        id
        parent {
          id
        }
      }
    }
  `,
  PublicPetitionField: gql`
    fragment focusPetitionField_PublicPetitionField on PublicPetitionField {
      id
      type
      replies {
        id
        parent {
          id
        }
      }
    }
  `,
};
