import { gql, useApolloClient, useMutation } from "@apollo/client";
import { VariablesOf } from "@graphql-typed-document-node/core";
import {
  useBackgroundTask_createExportExcelTaskDocument,
  useBackgroundTask_createPrintPdfTaskDocument,
  useBackgroundTask_createTemplateStatsReportTaskDocument,
  useBackgroundTask_getTaskResultFileUrlDocument,
  useBackgroundTask_taskDocument,
  useBackgroundTask_TaskFragment,
} from "@parallel/graphql/__types";
import { useCallback } from "react";

const TASK_DOCUMENTS = {
  PRINT_PDF: useBackgroundTask_createPrintPdfTaskDocument,
  EXPORT_EXCEL: useBackgroundTask_createExportExcelTaskDocument,
  TEMPLATE_STATS_REPORT: useBackgroundTask_createTemplateStatsReportTaskDocument,
} as const;

interface BackgroundTaskOptions {
  signal?: AbortSignal;
  timeout?: number;
  pollingInterval?: number;
}

export interface BackgroundTask<Task extends keyof typeof TASK_DOCUMENTS> {
  (variables: VariablesOf<typeof TASK_DOCUMENTS[Task]>, options?: BackgroundTaskOptions): Promise<{
    task: useBackgroundTask_TaskFragment;
    url?: string;
  }>;
}

export function useBackgroundTask<Task extends keyof typeof TASK_DOCUMENTS>(
  taskName: Task
): BackgroundTask<Task> {
  const apollo = useApolloClient();
  const [createTask] = useMutation(TASK_DOCUMENTS[taskName]);
  const [generateDownloadUrl] = useMutation(useBackgroundTask_getTaskResultFileUrlDocument);

  return useCallback(
    (async (
      variables: any,
      { signal, timeout = 60_00, pollingInterval = 3_000 }: BackgroundTaskOptions = {}
    ) => {
      const { data: initialData } = await createTask({ variables });

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
            query: useBackgroundTask_taskDocument,
            variables: { id: initialData!.createTask.id },
            fetchPolicy: "network-only",
          });
          if (task.status === "COMPLETED") {
            return task;
          } else if (task.status === "FAILED") {
            throw new Error("FAILED");
          }

          await new Promise((resolve) => setTimeout(resolve, pollingInterval));
        }
      })();

      if (taskName === "TEMPLATE_STATS_REPORT") {
        return { task };
      } else {
        const { data } = await generateDownloadUrl({ variables: { taskId: task!.id } });
        return { task, url: data!.getTaskResultFileUrl };
      }
    }) as any,
    []
  );
}

const fragments = {
  Task: gql`
    fragment useBackgroundTask_Task on Task {
      id
      status
      output
    }
  `,
};

const _mutations = [
  gql`
    mutation useBackgroundTask_createExportExcelTask($petitionId: GID!) {
      createTask: createExportExcelTask(petitionId: $petitionId) {
        ...useBackgroundTask_Task
      }
    }
    ${fragments.Task}
  `,
  gql`
    mutation useBackgroundTask_createPrintPdfTask($petitionId: GID!) {
      createTask: createPrintPdfTask(
        petitionId: $petitionId
        skipAttachments: true
        includeNdLinks: true
      ) {
        ...useBackgroundTask_Task
      }
    }
    ${fragments.Task}
  `,
  gql`
    mutation useBackgroundTask_createTemplateStatsReportTask($templateId: GID!) {
      createTask: createTemplateStatsReportTask(templateId: $templateId) {
        ...useBackgroundTask_Task
      }
    }
    ${fragments.Task}
  `,
  gql`
    mutation useBackgroundTask_getTaskResultFileUrl($taskId: GID!) {
      getTaskResultFileUrl(taskId: $taskId, preview: false)
    }
  `,
];

const _queries = [
  gql`
    query useBackgroundTask_task($id: GID!) {
      task(id: $id) {
        ...useBackgroundTask_Task
      }
    }
    ${fragments.Task}
  `,
];
