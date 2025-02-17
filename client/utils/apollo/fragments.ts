import { gql } from "@apollo/client";

const FullPetitionSigner = gql`
  fragment Fragments_FullPetitionSigner on PetitionSigner {
    contactId
    firstName
    lastName
    fullName
    email
    isPreset
  }
`;

const FullApprovalFlowConfig = gql`
  fragment Fragments_FullApprovalFlowConfig on ApprovalFlowConfig {
    name
    type
    values
    visibility
  }
`;

export const Fragments = {
  FullPetitionSigner,
  FullApprovalFlowConfig,
};
