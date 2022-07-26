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
    if (current && current.status !== "CANCELLED" && !isDefined(current.auditTrailFilename)) {
      startPolling(POLL_INTERVAL);
    } else if (
      (current?.status === "COMPLETED" && isDefined(current.auditTrailFilename)) ||
      current?.status === "CANCELLED"
    ) {
      stopPolling();
    }

    return stopPolling;
  }, [current?.status, current?.auditTrailFilename]);
}
