import { gql } from "@apollo/client";
import {
  usePetitionCanFinalize_PetitionBaseFragment,
  usePetitionCanFinalize_PublicPetitionFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { isNonNullish, omit, pick, zip } from "remeda";
import { completedFieldReplies } from "./completedFieldReplies";
import { useFieldLogic } from "./fieldLogic/useFieldLogic";

type PetitionSelection =
  | usePetitionCanFinalize_PetitionBaseFragment
  | usePetitionCanFinalize_PublicPetitionFragment;

export function usePetitionCanFinalize(petition: PetitionSelection, publicContext?: boolean) {
  const logic = useFieldLogic(petition);
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
                ?.filter((_, childReplyIndex) => {
                  //TODO: investigate why this is undefined when we delete children fields
                  return groupChildrenLogic?.[groupIndex][childReplyIndex]?.isVisible ?? false;
                })
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

    let lastCompletedFieldIndex = -1;
    let latestReplyDate = new Date(0);
    let lastCompletedFieldPage = null as number | null;

    visibleFields.forEach((field, index) => {
      field.replies.forEach((reply) => {
        const replyDate = new Date(reply.updatedAt ?? reply.createdAt);
        if (replyDate > latestReplyDate) {
          latestReplyDate = replyDate;
          lastCompletedFieldIndex = index;
          lastCompletedFieldPage = field.page;
        }
      });
    });

    let nextIncompleteField =
      incompleteFields.find((field) => {
        const fieldIndex = visibleFields.findIndex(
          (visibleField) =>
            visibleField.id === field.id ||
            visibleField.children?.some((child) => child.id === field.id),
        );

        return fieldIndex > lastCompletedFieldIndex;
      }) || incompleteFields[0];

    const incompleteFieldsInSamePage = lastCompletedFieldPage
      ? incompleteFields.filter((field) => field.page === lastCompletedFieldPage)
      : [];

    // If we gonna switch page and there are required incomplete fields on the same page, we choose the first one
    if (
      isNonNullish(nextIncompleteField) &&
      nextIncompleteField.page !== lastCompletedFieldPage &&
      incompleteFieldsInSamePage.length > 0
    ) {
      nextIncompleteField = incompleteFieldsInSamePage[0];
    }

    return {
      canFinalize: incompleteFields.length === 0,
      nextIncompleteField: nextIncompleteField
        ? pick(nextIncompleteField, ["id", "page", "parentReplyId"])
        : null,
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
          id
          createdAt
          updatedAt
          children {
            field {
              optional
              isInternal
              isReadOnly
              ...completedFieldReplies_PetitionField
            }
            replies {
              id
              content
              isAnonymized
              createdAt
              updatedAt
            }
          }
        }
        ...completedFieldReplies_PetitionField
      }
      ...useFieldLogic_PetitionBase
    }
    ${useFieldLogic.fragments.PetitionBase}
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
          id
          content
          isAnonymized
          createdAt
          updatedAt
          children {
            field {
              optional
              isInternal
              isReadOnly
              ...completedFieldReplies_PublicPetitionField
            }
            replies {
              id
              content
              isAnonymized
              createdAt
              updatedAt
            }
          }
        }
        ...completedFieldReplies_PublicPetitionField
      }
      ...useFieldLogic_PublicPetition
    }
    ${useFieldLogic.fragments.PublicPetition}
    ${completedFieldReplies.fragments.PublicPetitionField}
  `,
};
