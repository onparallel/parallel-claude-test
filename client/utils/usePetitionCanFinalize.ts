import { gql } from "@apollo/client";
import {
  usePetitionCanFinalize_PetitionBaseFragment,
  usePetitionCanFinalize_PublicPetitionFragment,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "./completedFieldReplies";
import { useFieldVisibility } from "./fieldVisibility/useFieldVisibility";

type usePetitionCanFinalize_Petition =
  | usePetitionCanFinalize_PetitionBaseFragment
  | usePetitionCanFinalize_PublicPetitionFragment;

export function usePetitionCanFinalize(
  petition: usePetitionCanFinalize_Petition,
  publicContext?: boolean,
) {
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

  const fieldVisibility = useFieldVisibility(petition.fields);
  const incompleteFields = fieldsWithPage.filter(
    (f, index) =>
      fieldVisibility[index] &&
      !(publicContext && f.isInternal) &&
      !f.optional &&
      completedFieldReplies(f).length === 0 &&
      !f.isReadOnly,
  );

  return { canFinalize: incompleteFields.length === 0, incompleteFields };
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
        ...useFieldVisibility_PetitionField
        ...completedFieldReplies_PetitionField
      }
    }
    ${useFieldVisibility.fragments.PetitionField}
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
        ...useFieldVisibility_PublicPetitionField
        ...completedFieldReplies_PublicPetitionField
      }
    }
    ${useFieldVisibility.fragments.PublicPetitionField}
    ${completedFieldReplies.fragments.PublicPetitionField}
  `,
};
