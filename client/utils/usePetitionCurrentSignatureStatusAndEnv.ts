import { gql } from "@apollo/client";
import {
  OrgIntegrationStatus,
  PetitionSignatureRequestStatus,
  usePetitionCurrentSignatureStatusAndEnv_PetitionFragment,
} from "@parallel/graphql/__types";

export function usePetitionCurrentSignatureStatusAndEnv(
  petition: usePetitionCurrentSignatureStatusAndEnv_PetitionFragment
): {
  env: OrgIntegrationStatus | undefined;
  status: PetitionSignatureRequestStatus | "START" | null;
} {
  const env =
    petition.signatureConfig?.integration?.status ||
    petition.currentSignatureRequest?.signatureConfig.integration?.status;

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
        signatureConfig {
          integration {
            status
          }
        }
      }
      signatureConfig {
        review
        integration {
          status
        }
      }
    }
  `,
};
