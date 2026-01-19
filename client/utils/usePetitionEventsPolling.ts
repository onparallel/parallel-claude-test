import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { PetitionEventsPolling_petitionDocument } from "@parallel/graphql/__types";
import { useEffect, useRef } from "react";
import { isNonNullish } from "remeda";
import { usePageVisibility } from "./usePageVisibility";

const EVENTS_POLL_INTERVAL = 15_000;
export function usePetitionEventsPolling(petitionId: string, callback: () => void) {
  const isPageVisible = usePageVisibility();

  const { data, dataState, stopPolling } = useQuery(PetitionEventsPolling_petitionDocument, {
    pollInterval: EVENTS_POLL_INTERVAL,
    variables: { petitionId },
    skip: !isPageVisible,
    skipPollAttempt: () => !isPageVisible,
  });

  const eventsCount = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (
      dataState === "complete" &&
      isNonNullish(data) &&
      isNonNullish(data.petition) &&
      data.petition.__typename === "Petition"
    ) {
      const newEventsCount = data.petition.events?.totalCount;
      const previousEventsCount = eventsCount.current;

      if (previousEventsCount !== undefined && newEventsCount !== previousEventsCount) {
        callback();
      }

      eventsCount.current = newEventsCount;
    }
  }, [data, dataState, callback]);

  return stopPolling;
}

const _queries = [
  gql`
    query PetitionEventsPolling_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        id
        ... on Petition {
          events {
            totalCount
          }
        }
      }
    }
  `,
];
