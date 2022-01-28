import { gql } from "@apollo/client";
import {
  groupFieldsByPages_PetitionFieldFragment,
  groupFieldsByPages_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { zip } from "remeda";

type PetitionFieldSelection =
  | groupFieldsByPages_PetitionFieldFragment
  | groupFieldsByPages_PublicPetitionFieldFragment;

export function groupFieldsByPages<T extends PetitionFieldSelection>(
  fields: T[],
  visibility: boolean[]
): T[][] {
  const pages: T[][] = [];
  let page: T[] = [];
  for (const [field, isVisible] of zip(fields, visibility)) {
    const isHiddenToPublic = field.__typename === "PublicPetitionField" && field.isInternal;
    if (field.type === "HEADING" && field.options!.hasPageBreak && !isHiddenToPublic) {
      if (page.length > 0) {
        pages.push(page);
        page = [];
      }
    }
    if (isVisible && !isHiddenToPublic) {
      page.push(field);
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
    }
  `,
};
