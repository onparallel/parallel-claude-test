import { gql } from "@apollo/client";
import {
  useGetPetitionPages_PetitionFieldFragment,
  useGetPetitionPages_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { zip } from "remeda";
import { useFieldLogic } from "./fieldLogic/useFieldLogic";
import { ArrayUnionToUnion } from "./types";

type PetitionFieldSelection =
  | useGetPetitionPages_PublicPetitionFieldFragment
  | useGetPetitionPages_PetitionFieldFragment;

interface useGetPetitionPagesOptions {
  usePreviewReplies?: boolean;
  hideInternalFields?: boolean;
}

export function useGetPetitionPages<T extends PetitionFieldSelection>(
  fields: T[],
  { usePreviewReplies, hideInternalFields }: useGetPetitionPagesOptions,
) {
  const logic = useFieldLogic(fields as any, usePreviewReplies);
  return useMemo(() => {
    const pages: T[][] = [];
    let page: T[] = [];
    for (const [field, { isVisible, groupChildrenLogic }] of zip(fields, logic)) {
      const isHidden = hideInternalFields && field.isInternal;
      if (!isHidden) {
        if (field.type === "HEADING" && field.options!.hasPageBreak) {
          if (page.length > 0) {
            pages.push(page);
            page = [];
          }
        }
        if (isVisible) {
          if (field.type === "FIELD_GROUP") {
            const repliesKey =
              usePreviewReplies && field.__typename === "PetitionField"
                ? "previewReplies"
                : "replies";
            page.push({
              ...field,
              [repliesKey]: zip(
                field[repliesKey as keyof typeof field] as ArrayUnionToUnion<
                  PetitionFieldSelection["replies"]
                >[],
                groupChildrenLogic!,
              ).map(([reply, childrenLogic]) => {
                return {
                  ...reply,
                  children: zip(
                    reply.children! as ArrayUnionToUnion<
                      ArrayUnionToUnion<PetitionFieldSelection["replies"]>["children"]
                    >[],
                    childrenLogic,
                  )
                    .filter(
                      ([child, { isVisible }]) =>
                        isVisible && !(hideInternalFields && child.field.isInternal),
                    )
                    .map(([r]) => r),
                };
              }),
            });
          } else {
            page.push(field);
          }
        }
      }
    }
    pages.push(page);
    return pages;
  }, [fields, logic, usePreviewReplies, hideInternalFields]);
}

useGetPetitionPages.fragments = {
  PublicPetitionField: gql`
    fragment useGetPetitionPages_PublicPetitionField on PublicPetitionField {
      id
      id
      type
      visibility
      options
      isInternal
      replies {
        children {
          field {
            isInternal
          }
        }
      }
      ...useFieldLogic_PublicPetitionField
    }
    ${useFieldLogic.fragments.PublicPetitionField}
  `,
  PetitionField: gql`
    fragment useGetPetitionPages_PetitionField on PetitionField {
      id
      id
      type
      visibility
      options
      isInternal
      replies {
        children {
          field {
            isInternal
          }
        }
      }
      ...useFieldLogic_PetitionField
    }
    ${useFieldLogic.fragments.PetitionField}
  `,
};
