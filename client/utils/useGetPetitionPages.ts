import { gql } from "@apollo/client";
import {
  useGetPetitionPages_PetitionBaseFragment,
  useGetPetitionPages_PublicPetitionFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { zip } from "remeda";
import { FieldLogic } from "./fieldLogic/types";
import { useFieldLogic } from "./fieldLogic/useFieldLogic";
import { ArrayUnionToUnion, UnwrapArray } from "./types";

type PetitionSelection =
  | useGetPetitionPages_PublicPetitionFragment
  | useGetPetitionPages_PetitionBaseFragment;

type PetitionFieldSelection = ArrayUnionToUnion<PetitionSelection["fields"]>;

interface useGetPetitionPagesOptions {
  usePreviewReplies?: boolean;
  hideInternalFields?: boolean;
}

export function useGetPetitionPages<T extends PetitionSelection>(
  petition: T,
  { usePreviewReplies, hideInternalFields }: useGetPetitionPagesOptions,
): { field: UnwrapArray<T["fields"]>; logic: FieldLogic }[][] {
  const fieldLogic = useFieldLogic(petition, usePreviewReplies);
  return useMemo(() => {
    const pages: { field: UnwrapArray<T["fields"]>; logic: FieldLogic }[][] = [];
    let page: { field: UnwrapArray<T["fields"]>; logic: FieldLogic }[] = [];
    const fields = petition.fields as PetitionFieldSelection[];
    for (const [field, logic] of zip(fields, fieldLogic)) {
      const isHidden = hideInternalFields && field.isInternal;
      if (!isHidden) {
        if (field.type === "HEADING" && field.options!.hasPageBreak) {
          if (page.length > 0) {
            pages.push(page);
            page = [];
          }
        }
        if (logic.isVisible) {
          if (field.type === "FIELD_GROUP") {
            const repliesKey =
              usePreviewReplies && field.__typename === "PetitionField"
                ? "previewReplies"
                : "replies";
            page.push({
              field: {
                ...field,
                [repliesKey]: zip(
                  field[repliesKey as keyof typeof field] as ArrayUnionToUnion<
                    PetitionFieldSelection["replies"]
                  >[],
                  logic.groupChildrenLogic!,
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
                      .map(([child]) => child),
                  };
                }),
              } as any,
              logic: {
                ...logic,
                groupChildrenLogic: logic.groupChildrenLogic!.map((g) =>
                  g.filter(({ isVisible }) => isVisible),
                ),
              } as any,
            });
          } else {
            page.push({ field: field as any, logic });
          }
        }
      }
    }
    pages.push(page);
    return pages;
  }, [petition.fields, fieldLogic, usePreviewReplies, hideInternalFields]);
}

const _fragments = {
  PublicPetition: gql`
    fragment useGetPetitionPages_PublicPetition on PublicPetition {
      ...useFieldLogic_PublicPetition
      fields {
        id
        type
        visibility
        options
        isInternal
        replies {
          id
          children {
            field {
              isInternal
            }
          }
        }
      }
    }
  `,
  PetitionBase: gql`
    fragment useGetPetitionPages_PetitionBase on PetitionBase {
      ...useFieldLogic_PetitionBase
      fields {
        id
        type
        visibility
        options
        isInternal
        replies {
          id
          children {
            field {
              isInternal
            }
          }
        }
      }
    }
  `,
};
