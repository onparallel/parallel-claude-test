import { gql, useMutation, useQuery } from "@apollo/client";
import {
  useBackgroundTask_createExportExcelTaskDocument,
  useBackgroundTask_createPrintPdfTaskDocument,
  useBackgroundTask_getTaskResultFileUrlDocument,
  useBackgroundTask_taskDocument,
  useBackgroundTask_taskQuery,
} from "@parallel/graphql/__types";

export function useBackgroundTask(task: "EXPORT_EXCEL" | "PRINT_PDF") {
  const [createTask] = useMutation(
    task === "EXPORT_EXCEL"
      ? useBackgroundTask_createExportExcelTaskDocument
      : task === "PRINT_PDF"
      ? useBackgroundTask_createPrintPdfTaskDocument
      : (null as never)
  );
  const [generateDownloadUrl] = useMutation(useBackgroundTask_getTaskResultFileUrlDocument);
  const { refetch } = useQuery(useBackgroundTask_taskDocument, {
    skip: true,
  });

  return async (petitionId: string) => {
    const { data: initialData } = await createTask({ variables: { petitionId } });

    const task = await new Promise<useBackgroundTask_taskQuery["task"]>((resolve, reject) => {
      const interval = setInterval(() => {
        try {
          refetch({
            id: initialData!.createTask.id,
          }).then(({ data: { task } }) => {
            if (task.status === "COMPLETED") {
              clearInterval(interval);
              resolve(task);
            } else if (task.status === "FAILED") {
              clearInterval(interval);
              reject();
            }
          });
        } catch {
          clearInterval(interval);
          reject();
        }
      }, 1000);
    });

    if (task?.status === "COMPLETED") {
      const { data } = await generateDownloadUrl({
        variables: { taskId: task!.id },
      });
      return { task, url: data!.getTaskResultFileUrl };
    } else {
      return { task };
    }
  };
}

useBackgroundTask.fragments = {
  Task: gql`
    fragment useBackgroundTask_Task on Task {
      id
      status
      output {
        filename
      }
    }
  `,
};

useBackgroundTask.mutations = [
  gql`
    mutation useBackgroundTask_createExportExcelTask($petitionId: GID!) {
      createTask: createExportExcelTask(petitionId: $petitionId) {
        ...useBackgroundTask_Task
      }
    }
    ${useBackgroundTask.fragments.Task}
  `,
  gql`
    mutation useBackgroundTask_createPrintPdfTask($petitionId: GID!) {
      createTask: createPrintPdfTask(petitionId: $petitionId) {
        ...useBackgroundTask_Task
      }
    }
    ${useBackgroundTask.fragments.Task}
  `,
  gql`
    mutation useBackgroundTask_getTaskResultFileUrl($taskId: GID!) {
      getTaskResultFileUrl(taskId: $taskId, preview: false)
    }
  `,
];

useBackgroundTask.queries = [
  gql`
    query useBackgroundTask_task($id: GID!) {
      task(id: $id) {
        ...useBackgroundTask_Task
      }
    }
    ${useBackgroundTask.fragments.Task}
  `,
];
