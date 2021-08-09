import { usePetitionCurrentSignatureStatus_PetitionFragment } from "@parallel/graphql/__types";
import gql from "graphql-tag";

export function usePetitionCurrentSignatureStatus(
  petition: usePetitionCurrentSignatureStatus_PetitionFragment
) {
  return petition.signatureConfig?.review &&
    ["COMPLETED", "CLOSED"].includes(petition.status) &&
    (!petition.currentSignatureRequest ||
      !["ENQUEUED", "PROCESSING"].includes(petition.currentSignatureRequest.status))
    ? "START"
    : petition.currentSignatureRequest?.status ?? (petition.signatureConfig ? "PROCESSING" : null);
}

usePetitionCurrentSignatureStatus.fragments = {
  Petition: gql`
    fragment usePetitionCurrentSignatureStatus_Petition on Petition {
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
