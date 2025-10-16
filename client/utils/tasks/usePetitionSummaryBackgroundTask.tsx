import { gql } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import {
  usePetitionSummaryBackgroundTask_createPetitionSummaryTaskDocument,
  usePetitionSummaryBackgroundTask_createPetitionSummaryTaskMutationVariables,
  usePetitionSummaryBackgroundTask_taskDocument,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { waitFor } from "../promises/waitFor";
import { BackgroundTaskOptions } from "./backgroundTaskOptions";

export function usePetitionSummaryBackgroundTask() {
  const apollo = useApolloClient();
  const [createPetitionSummaryTask] = useMutation(
    usePetitionSummaryBackgroundTask_createPetitionSummaryTaskDocument,
  );
  return useCallback(
    async (
      variables: usePetitionSummaryBackgroundTask_createPetitionSummaryTaskMutationVariables,
      { signal, timeout = 60_000, pollingInterval = 3_000 }: BackgroundTaskOptions = {},
    ) => {
      const { data: initialData } = await createPetitionSummaryTask({ variables });
      const task = await (async function () {
        const startTime = performance.now();
        while (true) {
          if (signal?.aborted) {
            throw new Error("ABORTED");
          }
          if (performance.now() - startTime > timeout) {
            throw new Error("TIMEOUT");
          }
          const { data } = await apollo.query({
            query: usePetitionSummaryBackgroundTask_taskDocument,
            variables: { id: initialData!.createPetitionSummaryTask.id },
            fetchPolicy: "network-only",
          });

          assert(
            isNonNullish(data),
            "Result data in usePetitionSummaryBackgroundTask_taskDocument is missing",
          );

          if (data.task.status === "COMPLETED") {
            return data.task;
          } else if (data.task.status === "FAILED") {
            throw new Error("FAILED");
          }
          await waitFor(pollingInterval);
        }
      })();
      return task;
    },
    [],
  );
}

usePetitionSummaryBackgroundTask.mutations = [
  gql`
    mutation usePetitionSummaryBackgroundTask_createPetitionSummaryTask($petitionId: GID!) {
      createPetitionSummaryTask(petitionId: $petitionId) {
        id
        status
        progress
      }
    }
  `,
];

const _queries = [
  gql`
    query usePetitionSummaryBackgroundTask_task($id: GID!) {
      task(id: $id) {
        id
        status
        output
      }
    }
  `,
];
