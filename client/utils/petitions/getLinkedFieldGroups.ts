import { gql } from "@apollo/client";
import { getLinkedFieldGroups_PetitionBaseFragment } from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";

/**
 * Gets all field groups linked to profile types from a petition
 */
export const getLinkedFieldGroups = (petition: getLinkedFieldGroups_PetitionBaseFragment) => {
  return petition.fields.filter(
    (field) =>
      isNonNullish(field) && field.type === "FIELD_GROUP" && field.isLinkedToProfileType === true,
  );
};

getLinkedFieldGroups.fragments = {
  PetitionBase: gql`
    fragment getLinkedFieldGroups_PetitionBase on PetitionBase {
      id
      fields {
        id
        type
        isLinkedToProfileType
      }
    }
  `,
};
