import { gql, useMutation, useQuery } from "@apollo/client";
import {
  useExportExcelTask_createExportExcelTaskDocument,
  useExportExcelTask_getTaskResultFileUrlDocument,
  useExportExcelTask_taskDocument,
  useExportExcelTask_taskQuery,
} from "@parallel/graphql/__types";

export function useExportExcelTask() {
  const [createTask] = useMutation(useExportExcelTask_createExportExcelTaskDocument);
  const [generateDownloadUrl] = useMutation(useExportExcelTask_getTaskResultFileUrlDocument);
  const { refetch } = useQuery(useExportExcelTask_taskDocument, {
    skip: true,
  });

  return async (petitionId: string) => {
    const { data: initialData } = await createTask({ variables: { petitionId } });

    const task = await new Promise<useExportExcelTask_taskQuery["task"]>((resolve, reject) => {
      const interval = setInterval(() => {
        try {
          refetch({
            id: initialData!.createExportExcelTask.id,
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

useExportExcelTask.fragments = {
  Task: gql`
    fragment useExportExcelTask_Task on Task {
      id
      status
      output {
        filename
      }
    }
  `,
};

useExportExcelTask.mutations = [
  gql`
    mutation useExportExcelTask_createExportExcelTask($petitionId: GID!) {
      createExportExcelTask(petitionId: $petitionId) {
        ...useExportExcelTask_Task
      }
    }
    ${useExportExcelTask.fragments.Task}
  `,
  gql`
    mutation useExportExcelTask_getTaskResultFileUrl($taskId: GID!) {
      getTaskResultFileUrl(taskId: $taskId, preview: false)
    }
  `,
];

useExportExcelTask.queries = [
  gql`
    query useExportExcelTask_task($id: GID!) {
      task(id: $id) {
        ...useExportExcelTask_Task
      }
    }
    ${useExportExcelTask.fragments.Task}
  `,
];
