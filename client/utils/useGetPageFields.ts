import { gql } from "@apollo/client";
import {
  useGetPageFields_PetitionFieldFragment,
  useGetPageFields_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useFieldVisibility } from "./fieldVisibility/useFieldVisibility";
import { groupFieldsByPages } from "./groupFieldsByPage";
import { UnionToArrayUnion } from "./types";

type PetitionFieldSelection =
  | useGetPageFields_PublicPetitionFieldFragment
  | useGetPageFields_PetitionFieldFragment;

export function useGetPageFields<T extends UnionToArrayUnion<PetitionFieldSelection>>(
  fields: T,
  page: number
) {
  const visibility = useFieldVisibility(fields);
  return useMemo(() => {
    const pages = groupFieldsByPages<PetitionFieldSelection>(fields, visibility);
    return { fields: pages[page - 1] as T, pages: pages.length, visibility };
  }, [fields, page, visibility]);
}

useGetPageFields.fragments = {
  PublicPetitionField: gql`
    fragment useGetPageFields_PublicPetitionField on PublicPetitionField {
      id
      type
      visibility
      ...useFieldVisibility_PublicPetitionField
    }
    ${useFieldVisibility.fragments.PublicPetitionField}
  `,
  PetitionField: gql`
    fragment useGetPageFields_PetitionField on PetitionField {
      id
      type
      visibility
      ...useFieldVisibility_PetitionField
    }
    ${useFieldVisibility.fragments.PetitionField}
  `,
};
