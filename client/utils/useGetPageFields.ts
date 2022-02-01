import { gql } from "@apollo/client";
import {
  useGetPageFields_PetitionFieldFragment,
  useGetPageFields_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useFieldVisibility } from "./fieldVisibility/useFieldVisibility";
import { groupFieldsByPages, GroupFieldsByPagesOptions } from "./groupFieldsByPage";
import { UnionToArrayUnion } from "./types";

type PetitionFieldSelection =
  | useGetPageFields_PublicPetitionFieldFragment
  | useGetPageFields_PetitionFieldFragment;

interface UseGetPageFieldsOptions extends GroupFieldsByPagesOptions {
  usePreviewReplies?: boolean;
}

export function useGetPageFields<T extends UnionToArrayUnion<PetitionFieldSelection>>(
  fields: T,
  page: number,
  { usePreviewReplies, ...options }: UseGetPageFieldsOptions
) {
  const visibility = useFieldVisibility(fields, usePreviewReplies);
  return useMemo(() => {
    const pages = groupFieldsByPages<PetitionFieldSelection>(fields, visibility, options);
    return { fields: pages[page - 1] as T, pages: pages.length, visibility };
  }, [fields, page, visibility, usePreviewReplies, options.hideInternalFields, options.isPdf]);
}

useGetPageFields.fragments = {
  PublicPetitionField: gql`
    fragment useGetPageFields_PublicPetitionField on PublicPetitionField {
      id
      ...groupFieldsByPages_PublicPetitionField
      ...useFieldVisibility_PublicPetitionField
    }
    ${groupFieldsByPages.fragments.PublicPetitionField}
    ${useFieldVisibility.fragments.PublicPetitionField}
  `,
  PetitionField: gql`
    fragment useGetPageFields_PetitionField on PetitionField {
      id
      ...groupFieldsByPages_PetitionField
      ...useFieldVisibility_PetitionField
    }
    ${groupFieldsByPages.fragments.PetitionField}
    ${useFieldVisibility.fragments.PetitionField}
  `,
};
