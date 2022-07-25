import { gql, useQuery } from "@apollo/client";
import { PetitionSignaturesCard } from "@parallel/components/petition-replies/PetitionSignaturesCard";
import {
  PetitionSignaturesCardPolling_petitionQuery,
  PetitionSignaturesCardPolling_petitionQueryVariables,
  PetitionSignaturesCard_PetitionFragment,
} from "@parallel/graphql/__types";
import { useEffect } from "react";
import { isDefined } from "remeda";

const POLL_INTERVAL = 10000;

export function usePetitionSignaturesCardPolling(
  petition: PetitionSignaturesCard_PetitionFragment
) {
  const current = petition.signatureRequests.at(0);
  const { startPolling, stopPolling } = useQuery<
    PetitionSignaturesCardPolling_petitionQuery,
    PetitionSignaturesCardPolling_petitionQueryVariables
  >(
    gql`
      query PetitionSignaturesCardPolling_petition($petitionId: GID!) {
        petition(id: $petitionId) {
          ...PetitionSignaturesCard_Petition
        }
      }
      ${PetitionSignaturesCard.fragments.Petition}
    `,
    { pollInterval: POLL_INTERVAL, variables: { petitionId: petition.id } }
  );

  useEffect(() => {
    if (current && ["ENQUEUED", "PROCESSING", "PROCESSED"].includes(current.status)) {
      startPolling(POLL_INTERVAL);
    } else if (
      current &&
      ["COMPLETED", "CANCELLED"].includes(current.status) &&
      isDefined(current.auditTrailFilename)
    ) {
      stopPolling();
    }

    return stopPolling;
  }, [current?.status, current?.auditTrailFilename]);
}
