import { gql } from "@apollo/client";
import {
  groupFieldsByPages_PetitionFieldFragment,
  groupFieldsByPages_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { zip } from "remeda";

type PetitionFieldSelection =
  | groupFieldsByPages_PetitionFieldFragment
  | groupFieldsByPages_PublicPetitionFieldFragment;

export interface GroupFieldsByPagesOptions {
  hideInternalFields?: boolean;
  isPdf?: boolean;
}
export function groupFieldsByPages<T extends PetitionFieldSelection>(
  fields: T[],
  visibility: boolean[],
  { hideInternalFields, isPdf }: GroupFieldsByPagesOptions
): T[][] {
  const pages: T[][] = [];
  let page: T[] = [];
  for (const [field, isVisible] of zip(fields, visibility)) {
    const isHidden =
      (hideInternalFields && field.isInternal) ||
      (isPdf && field.__typename === "PetitionField" && !field.showInPdf);
    if (!isHidden) {
      if (field.type === "HEADING" && field.options!.hasPageBreak) {
        if (page.length > 0) {
          pages.push(page);
          page = [];
        }
      }
      if (isVisible) {
        page.push(field);
      }
    }
  }
  pages.push(page);
  return pages;
}

groupFieldsByPages.fragments = {
  PublicPetitionField: gql`
    fragment groupFieldsByPages_PublicPetitionField on PublicPetitionField {
      id
      type
      visibility
      options
      isInternal
    }
  `,
  PetitionField: gql`
    fragment groupFieldsByPages_PetitionField on PetitionField {
      id
      type
      visibility
      options
      isInternal
      showInPdf
    }
  `,
};
