import { gql, useQuery } from "@apollo/client";
import { PetitionSignaturesCard } from "@parallel/components/petition-replies/PetitionSignaturesCard";
import {
  PetitionSignaturesCardPolling_petitionQuery,
  PetitionSignaturesCardPolling_petitionQueryVariables,
  PetitionSignaturesCard_PetitionFragment,
} from "@parallel/graphql/__types";
import { useEffect } from "react";

const POLL_INTERVAL = 10000;

export function usePetitionSignaturesCardPolling(
  petition: PetitionSignaturesCard_PetitionFragment
) {
  const current = petition.signatureRequests?.[0];
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
    if (current) {
      startPolling(POLL_INTERVAL);
      return stopPolling;
    }
  });
}
