import { gql } from "@apollo/client";
import {
  usePetitionCanFinalize_PetitionBaseFragment,
  usePetitionCanFinalize_PublicPetitionFragment,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "./completedFieldReplies";
import { useFieldLogic } from "./fieldLogic/useFieldLogic";
import { omit, pick, zip } from "remeda";
import { useMemo } from "react";

type usePetitionCanFinalize_Petition =
  | usePetitionCanFinalize_PetitionBaseFragment
  | usePetitionCanFinalize_PublicPetitionFragment;

export function usePetitionCanFinalize(
  petition: usePetitionCanFinalize_Petition,
  publicContext?: boolean,
) {
  const logic = useFieldLogic(petition.fields);
  return useMemo(() => {
    let page = 1;

    const fieldsWithPage = petition.fields.map((field) => {
      if (field.type === "HEADING" && field.options.hasPageBreak && !field.isInternal) {
        page++;
      }
      return {
        ...field,
        page,
      };
    });

    const visibleFields = zip(fieldsWithPage, logic)
      .filter(([_, { isVisible }]) => isVisible)
      .map(([field, { groupChildrenLogic }]) => {
        if (field.type === "FIELD_GROUP") {
          return {
            ...omit(field, ["__typename"]),
            replies: field.replies.map((r, groupIndex) => ({
              ...omit(r, ["__typename"]),
              children: r.children
                ?.filter(
                  (_, childReplyIndex) =>
                    groupChildrenLogic?.[groupIndex][childReplyIndex].isVisible ?? false,
                )
                .map((gr) => ({
                  ...omit(gr, ["__typename"]),
                  field: omit(gr.field, ["__typename"]),
                  replies: gr.replies.map((r) => omit(r, ["__typename"])),
                })),
            })),
          };
        } else {
          return field;
        }
      });

    const incompleteFields = visibleFields
      .filter(
        // remove every "parent" field that is fully completed
        (field) =>
          (publicContext ? !field.isInternal : true) &&
          !field.isReadOnly &&
          // FIELD_GROUP will always have at least 1 visible required child
          (field.type === "FIELD_GROUP" || !field.optional) &&
          (field.type === "FIELD_GROUP" || completedFieldReplies(field as any).length === 0) &&
          // for FIELD_GROUP we need to check if all children fields are completed
          (field.type !== "FIELD_GROUP" ||
            !field.replies.every((gr) =>
              (gr.children ?? []).every(
                (child) =>
                  (publicContext ? child.field.isInternal : false) ||
                  child.field.isReadOnly ||
                  child.field.optional ||
                  completedFieldReplies({
                    ...child.field,
                    replies: child.replies,
                  }).length > 0,
              ),
            )),
      )
      .map((field) => ({
        ...field,
        replies: field.replies.map((r) => ({
          ...r,
          children:
            // remove children fields that are fully completed
            field.type === "FIELD_GROUP"
              ? r.children!.filter(
                  (child) =>
                    (publicContext ? !child.field.isInternal : true) &&
                    !child.field.isReadOnly &&
                    !child.field.optional &&
                    completedFieldReplies({ ...child.field, replies: child.replies }).length === 0,
                )
              : undefined,
        })),
      }))
      // flatten children fields
      .flatMap((field) => {
        if (field.type === "FIELD_GROUP") {
          return field.replies.flatMap(
            (gr) =>
              gr.children?.map((child) => ({
                ...child.field,
                parentReplyId: gr.id as string | null,
                replies: child.replies,
                page: field.page,
              })) ?? [],
          );
        } else {
          return [{ ...omit(field, ["children"]), parentReplyId: null }];
        }
      });

    return {
      canFinalize: incompleteFields.length === 0,
      incompleteFields: incompleteFields.map((f) => pick(f, ["id", "page", "parentReplyId"])),
    };
  }, [logic]);
}

usePetitionCanFinalize.fragments = {
  PetitionBase: gql`
    fragment usePetitionCanFinalize_PetitionBase on PetitionBase {
      fields {
        type
        options
        optional
        isReadOnly
        isInternal
        replies {
          children {
            field {
              optional
              isInternal
              isReadOnly
              ...completedFieldReplies_PetitionField
            }
            replies {
              content
              isAnonymized
            }
          }
        }
        ...useFieldLogic_PetitionField
        ...completedFieldReplies_PetitionField
      }
    }
    ${useFieldLogic.fragments.PetitionField}
    ${completedFieldReplies.fragments.PetitionField}
  `,
  PublicPetition: gql`
    fragment usePetitionCanFinalize_PublicPetition on PublicPetition {
      fields {
        type
        options
        optional
        isReadOnly
        isInternal
        replies {
          content
          isAnonymized
          children {
            field {
              optional
              isInternal
              isReadOnly
              ...completedFieldReplies_PublicPetitionField
            }
            replies {
              content
              isAnonymized
            }
          }
        }
        ...useFieldLogic_PublicPetitionField
        ...completedFieldReplies_PublicPetitionField
      }
    }
    ${useFieldLogic.fragments.PublicPetitionField}
    ${completedFieldReplies.fragments.PublicPetitionField}
  `,
};
