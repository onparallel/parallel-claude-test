import { gql, useApolloClient, useMutation } from "@apollo/client";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  TaskProgressDialog,
  useTaskProgressDialog,
} from "@parallel/components/common/dialogs/TaskProgressDialog";
import {
  useExportRepliesTask_createExportRepliesTaskDocument,
  useExportRepliesTask_getTaskResultFileUrlDocument,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";
import { openNewWindow } from "./openNewWindow";
import { withError } from "./promises/withError";
import { Maybe } from "./types";

export function useExportRepliesTask() {
  const apollo = useApolloClient();
  const showError = useErrorDialog();
  const [generateDownloadURL] = useMutation(useExportRepliesTask_getTaskResultFileUrlDocument);
  const showTaskProgressDialog = useTaskProgressDialog();
  const intl = useIntl();

  return async (petitionId: string, pattern?: Maybe<string>) => {
    const [error, finishedTask] = await withError(async () => {
      return await showTaskProgressDialog({
        initTask: async () => {
          const { data } = await apollo.mutate({
            mutation: useExportRepliesTask_createExportRepliesTaskDocument,
            variables: { petitionId, pattern },
          });
          if (!isDefined(data)) {
            throw new Error();
          }
          return data.createExportRepliesTask;
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
    } else if (!error) {
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
