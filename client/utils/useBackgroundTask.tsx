import { gql, useMutation, useQuery } from "@apollo/client";
import {
  useBackgroundTask_createExportExcelTaskDocument,
  useBackgroundTask_createPrintPdfTaskDocument,
  useBackgroundTask_getTaskResultFileUrlDocument,
  useBackgroundTask_taskDocument,
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
    const { data } = await generateDownloadUrl({ variables: { taskId: task!.id } });
    return { task, url: data!.getTaskResultFileUrl };
  };
}

const fragments = {
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
      createTask: createPrintPdfTask(petitionId: $petitionId) {
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
