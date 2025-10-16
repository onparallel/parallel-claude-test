import { gql } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import {
  useExportExcelTask_createExportExcelTaskDocument,
  useExportExcelTask_createExportExcelTaskMutationVariables,
  useExportExcelTask_getTaskResultFileDocument,
  useExportExcelTask_taskDocument,
} from "@parallel/graphql/__types";

import { useCallback } from "react";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { waitFor } from "./../promises/waitFor";
import { BackgroundTaskOptions } from "./backgroundTaskOptions";

export function useExportExcelBackgroundTask() {
  const apollo = useApolloClient();
  const [createExportExcelTask] = useMutation(useExportExcelTask_createExportExcelTaskDocument);
  const [getTaskResultFile] = useMutation(useExportExcelTask_getTaskResultFileDocument);

  return useCallback(
    async (
      variables: useExportExcelTask_createExportExcelTaskMutationVariables,
      { signal, timeout = 60_000, pollingInterval = 3_000 }: BackgroundTaskOptions = {},
    ) => {
      const { data: initialData } = await createExportExcelTask({ variables });

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
            query: useExportExcelTask_taskDocument,
            variables: { id: initialData!.createExportExcelTask.id },
            fetchPolicy: "network-only",
          });

          assert(isNonNullish(data), "Result data in useExportExcelTask_taskDocument is missing");

          if (data.task.status === "COMPLETED") {
            return data.task;
          } else if (data.task.status === "FAILED") {
            throw new Error("FAILED");
          }
          await waitFor(pollingInterval);
        }
      })();

      const { data } = await getTaskResultFile({ variables: { taskId: task!.id } });
      return {
        url: data!.getTaskResultFile.url,
        filename: data!.getTaskResultFile.filename,
      };
    },
    [],
  );
}

const fragments = {
  Task: gql`
    fragment useExportExcelTask_Task on Task {
      id
      status
      output
    }
  `,
};

const _mutations = [
  gql`
    mutation useExportExcelTask_createExportExcelTask($petitionId: GID!) {
      createExportExcelTask(petitionId: $petitionId) {
        ...useExportExcelTask_Task
      }
    }
    ${fragments.Task}
  `,
  gql`
    mutation useExportExcelTask_getTaskResultFile($taskId: GID!) {
      getTaskResultFile(taskId: $taskId, preview: false) {
        filename
        url
      }
    }
  `,
];

const _queries = [
  gql`
    query useExportExcelTask_task($id: GID!) {
      task(id: $id) {
        ...useExportExcelTask_Task
      }
    }
    ${fragments.Task}
  `,
];
