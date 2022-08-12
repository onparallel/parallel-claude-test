import { gql } from "@apollo/client";
import { getPetitionSignatureStatus_PetitionFragment } from "@parallel/graphql/__types";
import { isDefined } from "remeda";

export type PetitionSignatureStatus = ReturnType<typeof getPetitionSignatureStatus>;
export function getPetitionSignatureStatus({
  status,
  currentSignatureRequest,
  signatureConfig,
}: getPetitionSignatureStatus_PetitionFragment) {
  if (isDefined(signatureConfig) && status === "PENDING") {
    // petition has signature configured but it's not yet completed
    return "NOT_STARTED";
  } else if (
    signatureConfig?.review &&
    ["COMPLETED", "CLOSED"].includes(status) &&
    (!currentSignatureRequest ||
      ["COMPLETED", "CANCELLED"].includes(currentSignatureRequest.status))
  ) {
    // petition is completed and configured to be reviewed before starting signature
    // and signature was never started or the last one is already completed (now we're starting a new request)
    // this means the user has to manually trigger the start of the signature request
    return "PENDING_START";
  } else if (isDefined(currentSignatureRequest)) {
    // signature request is already started, return the current status
    if (["ENQUEUED", "PROCESSING", "PROCESSED"].includes(currentSignatureRequest.status)) {
      return "PROCESSING";
    } else {
      return currentSignatureRequest.status as "COMPLETED" | "CANCELLED";
    }
  }

  // petition doesn't have signature configured and never started a signature request
  return "NO_SIGNATURE";
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
