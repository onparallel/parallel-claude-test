import { gql } from "@apollo/client";
import {
  getPetitionSignatureStatus_PetitionFragment,
  PetitionSignatureRequestStatus,
} from "@parallel/graphql/__types";

export function getPetitionSignatureStatus(
  petition: getPetitionSignatureStatus_PetitionFragment
): PetitionSignatureRequestStatus | "START" | null {
  return petition.signatureConfig?.review &&
    ["COMPLETED", "CLOSED"].includes(petition.status) &&
    (!petition.currentSignatureRequest ||
      !["ENQUEUED", "PROCESSING"].includes(petition.currentSignatureRequest.status))
    ? "START"
    : petition.currentSignatureRequest?.status ?? (petition.signatureConfig ? "PROCESSING" : null);
}

getPetitionSignatureStatus.fragments = {
  Petition: gql`
    fragment getPetitionSignatureStatus_Petition on Petition {
      status
      currentSignatureRequest {
        status
      }
      signatureConfig {
        review
      }
    }
  `,
};
