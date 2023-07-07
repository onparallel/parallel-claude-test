import { gql, useApolloClient, useMutation } from "@apollo/client";
import {
  useTemplateStatsReportTask_createTemplateStatsReportTaskDocument,
  useTemplateStatsReportTask_createTemplateStatsReportTaskMutationVariables,
  useTemplateStatsReportTask_taskDocument,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
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
          const {
            data: { task },
          } = await apollo.query({
            query: useTemplateStatsReportTask_taskDocument,
            variables: { id: initialData!.createTemplateStatsReportTask.id },
            fetchPolicy: "network-only",
          });
          if (task.status === "COMPLETED") {
            return task;
          } else if (task.status === "FAILED") {
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

const fragments = {
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
    ${fragments.Task}
  `,
];

const _queries = [
  gql`
    query useTemplateStatsReportTask_task($id: GID!) {
      task(id: $id) {
        ...useTemplateStatsReportTask_Task
      }
    }
    ${fragments.Task}
  `,
];
