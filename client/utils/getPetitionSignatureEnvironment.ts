import { gql } from "@apollo/client";
import {
  getPetitionSignatureEnvironment_PetitionFragment,
  SignatureOrgIntegrationEnvironment,
} from "@parallel/graphql/__types";

export function getPetitionSignatureEnvironment(
  petition: getPetitionSignatureEnvironment_PetitionFragment
): SignatureOrgIntegrationEnvironment | null {
  return (
    petition.currentSignatureRequest?.environment ??
    petition.signatureConfig?.integration?.environment ??
    null
  );
}

getPetitionSignatureEnvironment.fragments = {
  Petition: gql`
    fragment getPetitionSignatureEnvironment_Petition on Petition {
      currentSignatureRequest {
        environment
      }
      signatureConfig {
        integration {
          environment
        }
      }
    }
  `,
};
