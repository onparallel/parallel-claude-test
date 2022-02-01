import { gql, useMutation, useQuery } from "@apollo/client";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  TaskProgressDialog,
  useTaskProgressDialog,
} from "@parallel/components/common/dialogs/TaskProgressDialog";
import {
  useExportRepliesTask_createExportRepliesTaskDocument,
  useExportRepliesTask_getTaskResultFileUrlDocument,
  useExportRepliesTask_taskDocument,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { openNewWindow } from "./openNewWindow";
import { withError } from "./promises/withError";
import { Maybe } from "./types";

export function useExportRepliesTask() {
  const showError = useErrorDialog();
  const [createTask] = useMutation(useExportRepliesTask_createExportRepliesTaskDocument);
  const [generateDownloadURL] = useMutation(useExportRepliesTask_getTaskResultFileUrlDocument);
  const showTaskProgressDialog = useTaskProgressDialog();
  const intl = useIntl();

  const { refetch } = useQuery(useExportRepliesTask_taskDocument, { skip: true });

  return async (petitionId: string, pattern?: Maybe<string>) => {
    const [error, finishedTask] = await withError(async () => {
      const { data } = await createTask({ variables: { petitionId, pattern } });
      return await showTaskProgressDialog({
        task: data!.createExportRepliesTask,
        refetch: async () => {
          const { data: refetchData } = await refetch({ id: data!.createExportRepliesTask.id });
          return refetchData.task;
        },
        dialogHeader: intl.formatMessage({
          id: "component.export-replies-task.header",
          defaultMessage: "Exporting replies...",
        }),
        confirmText: intl.formatMessage({
          id: "component.export-replies-task.confirm",
          defaultMessage: "Download ZIP",
        }),
      });
    });

    if (error?.message === "SERVER_ERROR") {
      await showError({
        message: intl.formatMessage({
          id: "generic.unexpected-error-happened",
          defaultMessage:
            "An unexpected error happened. Please try refreshing your browser window and, if it persists, reach out to support for help.",
        }),
      });
    } else {
      openNewWindow(async () => {
        const { data } = await generateDownloadURL({ variables: { taskId: finishedTask!.id } });
        if (!data?.getTaskResultFileUrl) {
          throw new Error();
        }
        return data.getTaskResultFileUrl;
      });
    }
  };
}

useExportRepliesTask.queries = [
  gql`
    query useExportRepliesTask_task($id: GID!) {
      task(id: $id) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
];

useExportRepliesTask.mutations = [
  gql`
    mutation useExportRepliesTask_createExportRepliesTask($petitionId: GID!, $pattern: String) {
      createExportRepliesTask(petitionId: $petitionId, pattern: $pattern) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
  gql`
    mutation useExportRepliesTask_getTaskResultFileUrl($taskId: GID!) {
      getTaskResultFileUrl(taskId: $taskId, preview: false)
    }
  `,
];
