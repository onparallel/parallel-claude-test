import { gql, useMutation, useQuery } from "@apollo/client";
import {
  useBackgroundTask_createExportExcelTaskDocument,
  useBackgroundTask_createPrintPdfTaskDocument,
  useBackgroundTask_createTemplateStatsReportTaskDocument,
  useBackgroundTask_getTaskResultFileUrlDocument,
  useBackgroundTask_taskDocument,
} from "@parallel/graphql/__types";

export function useBackgroundTask(taskName: "EXPORT_EXCEL" | "PRINT_PDF" | "STATS_REPORT") {
  const [createTask] = useMutation(
    taskName === "EXPORT_EXCEL"
      ? useBackgroundTask_createExportExcelTaskDocument
      : taskName === "PRINT_PDF"
      ? useBackgroundTask_createPrintPdfTaskDocument
      : taskName === "STATS_REPORT"
      ? useBackgroundTask_createTemplateStatsReportTaskDocument
      : (null as never)
  );
  const [generateDownloadUrl] = useMutation(useBackgroundTask_getTaskResultFileUrlDocument);
  const { refetch } = useQuery(useBackgroundTask_taskDocument, {
    skip: true,
  });

  return async (petitionId: string) => {
    const { data: initialData } = await createTask({ variables: { petitionId } });

    const task = await (async function () {
      while (true) {
        const {
          data: { task },
        } = await refetch({
          id: initialData!.createTask.id,
        });
        if (task.status === "COMPLETED") {
          return task;
        } else if (task.status === "FAILED") {
          throw new Error("FAILED");
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    })();

    if (taskName === "STATS_REPORT") {
      return { task };
    } else {
      const { data } = await generateDownloadUrl({ variables: { taskId: task!.id } });
      return { task, url: data!.getTaskResultFileUrl };
    }
  };
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
    mutation useBackgroundTask_getTaskResultFileUrl($taskId: GID!) {
      getTaskResultFileUrl(taskId: $taskId, preview: false)
    }
  `,
  gql`
    mutation useBackgroundTask_createTemplateStatsReportTask($petitionId: GID!) {
      createTask: createTemplateStatsReportTask(templateId: $petitionId) {
        ...useBackgroundTask_Task
      }
    }
    ${fragments.Task}
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
