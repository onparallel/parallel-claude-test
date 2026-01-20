import { gql } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import {
  useTemplateStatsReportTask_createTemplateStatsReportTaskDocument,
  useTemplateStatsReportTask_createTemplateStatsReportTaskMutationVariables,
  useTemplateStatsReportTask_taskDocument,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { waitFor } from "../promises/waitFor";
import { BackgroundTaskOptions } from "./backgroundTaskOptions";

export function useTemplateStatsReportBackgroundTask() {
  const apollo = useApolloClient();
  const [createTemplateStatsReportTask] = useMutation(
    useTemplateStatsReportTask_createTemplateStatsReportTaskDocument,
  );

  return useCallback(
    async (
      variables: useTemplateStatsReportTask_createTemplateStatsReportTaskMutationVariables,
      { signal, timeout = 60_000, pollingInterval = 3_000 }: BackgroundTaskOptions = {},
    ) => {
      const { data: initialData } = await createTemplateStatsReportTask({ variables });

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
            query: useTemplateStatsReportTask_taskDocument,
            variables: { id: initialData!.createTemplateStatsReportTask.id },
            fetchPolicy: "network-only",
          });

          assert(
            isNonNullish(data),
            "Result data in useTemplateStatsReportTask_taskDocument is missing",
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
    fragment useTemplateStatsReportTask_Task on Task {
      id
      status
      output
    }
  `,
};

const _mutations = [
  gql`
    mutation useTemplateStatsReportTask_createTemplateStatsReportTask(
      $templateId: GID!
      $startDate: DateTime
      $endDate: DateTime
    ) {
      createTemplateStatsReportTask(
        templateId: $templateId
        startDate: $startDate
        endDate: $endDate
      ) {
        ...useTemplateStatsReportTask_Task
      }
    }
  `,
];

const _queries = [
  gql`
    query useTemplateStatsReportTask_task($id: GID!) {
      task(id: $id) {
        ...useTemplateStatsReportTask_Task
      }
    }
  `,
];
