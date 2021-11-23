import { gql, useMutation } from "@apollo/client";
import { useDialog } from "@parallel/components/common/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/ErrorDialog";
import { TaskProgressDialog } from "@parallel/components/common/TaskProgressDialog";
import {
  useExportRepliesTask_createExportRepliesTaskDocument,
  useExportRepliesTask_getTaskResultFileUrlDocument,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { openNewWindow } from "./openNewWindow";
import { withError } from "./promises/withError";
import { Maybe } from "./types";

export function useExportRepliesTask() {
  const showError = useErrorDialog();
  const [createTask] = useMutation(useExportRepliesTask_createExportRepliesTaskDocument);
  const [generateDownloadURL] = useMutation(useExportRepliesTask_getTaskResultFileUrlDocument);
  const showTaskProgressDialog = useDialog(TaskProgressDialog);
  const intl = useIntl();

  return async (petitionId: string, pattern?: Maybe<string>) => {
    const [error, finishedTask] = await withError(async () => {
      const { data } = await createTask({ variables: { petitionId, pattern } });
      return await showTaskProgressDialog({
        task: data!.createExportRepliesTask,
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
        if (data?.getTaskResultFileUrl.result !== "SUCCESS") {
          throw new Error();
        }
        return data.getTaskResultFileUrl.url!;
      });
    }
  };
}

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
      getTaskResultFileUrl(taskId: $taskId, preview: false) {
        result
        url
      }
    }
  `,
];
