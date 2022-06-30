import { gql, useApolloClient, useMutation } from "@apollo/client";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  TaskProgressDialog,
  useTaskProgressDialog,
} from "@parallel/components/common/dialogs/TaskProgressDialog";
import {
  useExportRepliesTask_createExportRepliesTaskDocument,
  useExportRepliesTask_getTaskResultFileDocument,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";
import { openNewWindow } from "./openNewWindow";
import { withError } from "./promises/withError";
import { Maybe } from "./types";

export function useExportRepliesTask() {
  const apollo = useApolloClient();
  const showError = useErrorDialog();
  const [getTaskResultFile] = useMutation(useExportRepliesTask_getTaskResultFileDocument);
  const showTaskProgressDialog = useTaskProgressDialog();
  const intl = useIntl();

  return async (petitionId: string, pattern?: Maybe<string>) => {
    const [taskError, finishedTask] = await withError(async () => {
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

    if (taskError?.message === "SERVER_ERROR") {
      await withError(
        showError({
          message: intl.formatMessage({
            id: "generic.unexpected-error-happened",
            defaultMessage:
              "An unexpected error happened. Please try refreshing your browser window and, if it persists, reach out to support for help.",
          }),
        })
      );
    } else if (!taskError) {
      const [error] = await withError(
        openNewWindow(async () => {
          const { data } = await getTaskResultFile({
            variables: { taskId: finishedTask!.id },
          });
          return data!.getTaskResultFile.url;
        })
      );
      if (error) {
        await withError(
          showError({
            message: intl.formatMessage({
              id: "generic.unexpected-error-happened",
              defaultMessage:
                "An unexpected error happened. Please try refreshing your browser window and, if it persists, reach out to support for help.",
            }),
          })
        );
      }
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
    mutation useExportRepliesTask_getTaskResultFile($taskId: GID!) {
      getTaskResultFile(taskId: $taskId, preview: false) {
        url
      }
    }
  `,
];
