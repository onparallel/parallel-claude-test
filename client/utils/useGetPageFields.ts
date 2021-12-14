import { gql } from "@apollo/client";
import { useMemo } from "react";
import { useFieldVisibility } from "./fieldVisibility/useFieldVisibility";
import { groupFieldsByPages } from "./groupFieldsByPage";

// TODO: Fix types
export function useGetPageFields(fields: any[], page: number) {
  const visibility = useFieldVisibility(fields);
  return useMemo(() => {
    const pages = groupFieldsByPages(fields, visibility);
    return { fields: pages[page - 1], pages: pages.length, visibility };
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
