import { gql } from "@apollo/client";
import {
  useFieldLogic_PetitionBaseFragment,
  useFieldLogic_PublicPetitionFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { evaluateFieldLogic } from "./fieldLogic";
import { FieldLogicResult, PetitionFieldMath, PetitionFieldVisibility } from "./types";

/**
 * Evaluates the visibility of the fields based on the visibility conditions
 * and the replies.
 * Returns an array with the visibilities corresponding to each field in the
 * passed array of fields.
 */
export function useFieldLogic(
  petition: useFieldLogic_PetitionBaseFragment | useFieldLogic_PublicPetitionFragment,
  usePreviewReplies = false,
): FieldLogicResult[] {
  return useMemo(
    () =>
      evaluateFieldLogic({
        variables: petition.variables,
        customLists: petition.customLists,
        automaticNumberingConfig: petition.automaticNumberingConfig ?? null,
        standardListDefinitions: petition.standardListDefinitions,
        fields: petition.fields.map((field) => ({
          id: field.id,
          type: field.type,
          options: field.options,
          visibility: (field.visibility ?? null) as PetitionFieldVisibility | null,
          math: (field.math ?? null) as PetitionFieldMath[] | null,
          children:
            field.children?.map((child) => ({
              id: child.id,
              type: child.type,
              options: child.options,
              visibility: (child.visibility ?? null) as PetitionFieldVisibility | null,
              math: (child.math ?? null) as PetitionFieldMath[] | null,
              replies:
                usePreviewReplies && child.__typename === "PetitionField"
                  ? child.previewReplies
                  : child.replies,
            })) ?? null,
          replies: (usePreviewReplies && field.__typename === "PetitionField"
            ? field.previewReplies
            : field.replies
          ).map((reply) => ({
            ...reply,
            children: reply.children ?? null,
          })),
        })),
      }),
    [petition.fields, petition.variables],
  );
}

useFieldLogic.fragments = {
  PublicPetition: gql`
    fragment useFieldLogic_PublicPetition on PublicPetition {
      automaticNumberingConfig {
        numberingType
      }
      variables {
        name
        defaultValue
      }
      customLists {
        name
        values
      }
      standardListDefinitions {
        id
        listName
        values {
          key
        }
      }
      fields {
        ...useFieldLogic_PublicPetitionField
      }
    }
    fragment useFieldLogic_PublicPetitionField on PublicPetitionField {
      ...useFieldLogic_PublicPetitionFieldInner
      children {
        ...useFieldLogic_PublicPetitionFieldInner
        parent {
          id
        }
        replies {
          id
          content
          isAnonymized
        }
      }
      replies {
        id
        content
        isAnonymized
        children {
          field {
            id
          }
          replies {
            id
            content
            isAnonymized
          }
        }
      }
    }
    fragment useFieldLogic_PublicPetitionFieldInner on PublicPetitionField {
      id
      type
      options
      visibility
      math
    }
  `,
  PetitionBase: gql`
    fragment useFieldLogic_PetitionBase on PetitionBase {
      automaticNumberingConfig {
        numberingType
      }
      variables {
        name
        defaultValue
      }
      customLists {
        name
        values
      }
      standardListDefinitions {
        id
        listName
        values {
          key
        }
      }
      fields {
        ...useFieldLogic_PetitionField
      }
    }
    fragment useFieldLogic_PetitionField on PetitionField {
      ...useFieldLogic_PetitionFieldInner
      children {
        ...useFieldLogic_PetitionFieldInner
        parent {
          id
        }
        replies {
          id
          content
          isAnonymized
        }
        previewReplies @client {
          id
          content
          isAnonymized
        }
      }
      replies {
        id
        content
        isAnonymized
        children {
          field {
            id
          }
          replies {
            id
            content
            isAnonymized
          }
        }
      }
      previewReplies @client {
        id
        content
        isAnonymized
        children {
          field {
            id
            parent {
              id
            }
          }
          replies {
            id
            content
            isAnonymized
          }
        }
      }
    }
    fragment useFieldLogic_PetitionFieldInner on PetitionField {
      id
      type
      options
      visibility
      math
    }
  `,
};
