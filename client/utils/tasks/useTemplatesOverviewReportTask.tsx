import { gql } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import {
  useTemplatesOverviewReportTask_createTemplatesOverviewReportTaskDocument,
  useTemplatesOverviewReportTask_createTemplatesOverviewReportTaskMutationVariables,
  useTemplatesOverviewReportTask_taskDocument,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { waitFor } from "../promises/waitFor";
import { BackgroundTaskOptions } from "./backgroundTaskOptions";

export function useTemplatesOverviewReportBackgroundTask() {
  const apollo = useApolloClient();
  const [reateTemplatesOverviewReportTask] = useMutation(
    useTemplatesOverviewReportTask_createTemplatesOverviewReportTaskDocument,
  );

  return useCallback(
    async (
      variables: useTemplatesOverviewReportTask_createTemplatesOverviewReportTaskMutationVariables,
      { signal, timeout = 60_000, pollingInterval = 3_000 }: BackgroundTaskOptions = {},
    ) => {
      const { data: initialData } = await reateTemplatesOverviewReportTask({ variables });

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
            query: useTemplatesOverviewReportTask_taskDocument,
            variables: { id: initialData!.createTemplatesOverviewReportTask.id },
            fetchPolicy: "network-only",
          });

          assert(
            isNonNullish(data),
            "Result data in useTemplatesOverviewReportTask_taskDocument is missing",
          );

          if (data.task.status === "COMPLETED") {
            return data.task;
          } else if (data.task.status === "FAILED") {
            throw new Error("FAILED");
          }

          await waitFor(pollingInterval);
        }
      })();

      return { task };
    },
    [],
  );
}

const _fragments = {
  Task: gql`
    fragment useTemplatesOverviewReportTask_Task on Task {
      id
      status
      output
    }
  `,
};

const _mutations = [
  gql`
    mutation useTemplatesOverviewReportTask_createTemplatesOverviewReportTask(
      $startDate: DateTime
      $endDate: DateTime
    ) {
      createTemplatesOverviewReportTask(startDate: $startDate, endDate: $endDate) {
        ...useTemplatesOverviewReportTask_Task
      }
    }
  `,
];

const _queries = [
  gql`
    query useTemplatesOverviewReportTask_task($id: GID!) {
      task(id: $id) {
        ...useTemplatesOverviewReportTask_Task
      }
    }
  `,
];
