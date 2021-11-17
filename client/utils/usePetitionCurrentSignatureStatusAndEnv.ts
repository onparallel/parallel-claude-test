import { gql } from "@apollo/client";
import {
  SignatureOrgIntegrationEnvironment,
  PetitionSignatureRequestStatus,
  usePetitionCurrentSignatureStatusAndEnv_PetitionFragment,
} from "@parallel/graphql/__types";

export function usePetitionCurrentSignatureStatusAndEnv(
  petition: usePetitionCurrentSignatureStatusAndEnv_PetitionFragment
): {
  env: SignatureOrgIntegrationEnvironment | null;
  status: PetitionSignatureRequestStatus | "START" | null;
} {
  const env =
    petition.currentSignatureRequest?.environment ??
    petition.signatureConfig?.integration?.environment ??
    null;
  const status =
    petition.signatureConfig?.review &&
    ["COMPLETED", "CLOSED"].includes(petition.status) &&
    (!petition.currentSignatureRequest ||
      !["ENQUEUED", "PROCESSING"].includes(petition.currentSignatureRequest.status))
      ? "START"
      : petition.currentSignatureRequest?.status ??
        (petition.signatureConfig ? "PROCESSING" : null);

  return { status, env };
}

usePetitionCurrentSignatureStatusAndEnv.fragments = {
  Petition: gql`
    fragment usePetitionCurrentSignatureStatusAndEnv_Petition on Petition {
      status
      currentSignatureRequest {
        status
        environment
      }
      signatureConfig {
        review
        integration {
          environment
        }
      }
    }
  `,
};
