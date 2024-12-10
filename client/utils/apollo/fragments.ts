import { gql } from "@apollo/client";

export const FullPetitionSignerFragment = gql`
  fragment Fragments_FullPetitionSigner on PetitionSigner {
    contactId
    firstName
    lastName
    fullName
    email
    isPreset
  }
`;
