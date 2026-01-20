import { gql } from "@apollo/client";
import {
  getPetitionSignatureStatus_PetitionFragment,
  getPetitionSignatureStatus_PublicPetitionFragment,
  PetitionSignatureStatusFilter,
} from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";

type PetitionSignatureStatusProps =
  | getPetitionSignatureStatus_PetitionFragment
  | getPetitionSignatureStatus_PublicPetitionFragment;

export function getPetitionSignatureStatus({
  status,
  currentSignatureRequest,
  signatureConfig,
}: PetitionSignatureStatusProps): PetitionSignatureStatusFilter {
  if (
    signatureConfig?.isEnabled &&
    ["COMPLETED", "CLOSED"].includes(status) &&
    (!currentSignatureRequest ||
      currentSignatureRequest.status === "COMPLETED" ||
      currentSignatureRequest.cancelReason === "CANCELLED_BY_USER")
  ) {
    // petition is completed and configured to be reviewed before starting signature
    // and signature was never started or the last one is already completed (now we're starting a new request)
    // this means the user has to manually trigger the start of the signature request
    return "PENDING_START";
  }

  if (isNonNullish(currentSignatureRequest)) {
    // signature request is already started, return the current status
    if (["ENQUEUED", "PROCESSING", "PROCESSED"].includes(currentSignatureRequest.status)) {
      return "PROCESSING";
    } else {
      return currentSignatureRequest.status as "COMPLETED" | "CANCELLED";
    }
  } else if (signatureConfig?.isEnabled && ["DRAFT", "PENDING"].includes(status)) {
    // petition has signature configured but it's not yet completed
    return "NOT_STARTED";
  }

  // petition doesn't have signature configured and never started a signature request
  return "NO_SIGNATURE";
}

const _fragments = {
  Petition: gql`
    fragment getPetitionSignatureStatus_Petition on Petition {
      status
      currentSignatureRequest {
        id
        status
        cancelReason
      }
      signatureConfig {
        isEnabled
        review
      }
    }
  `,
  PublicPetition: gql`
    fragment getPetitionSignatureStatus_PublicPetition on PublicPetition {
      status
      currentSignatureRequest: latestSignatureRequest {
        id
        status
        cancelReason
      }
      signatureConfig {
        isEnabled
        review
      }
    }
  `,
};
