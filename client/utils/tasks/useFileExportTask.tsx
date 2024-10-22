import { gql, useApolloClient } from "@apollo/client";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  TaskProgressDialog,
  useTaskProgressDialog,
} from "@parallel/components/common/dialogs/TaskProgressDialog";
import { useFileExportTask_createFileExportTaskDocument } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { isNullish } from "remeda";
import { isWindowBlockedError, openNewWindow } from "../openNewWindow";
import { withError } from "../promises/withError";

export function useFileExportTask() {
  const apollo = useApolloClient();
  const showError = useErrorDialog();
  const showTaskProgressDialog = useTaskProgressDialog();
  const intl = useIntl();

  return async (petitionId: string, integrationId: string, pattern?: string) => {
    const [taskError, finishedTask] = await withError(async () => {
      return await showTaskProgressDialog({
        initTask: async () => {
          const { data } = await apollo.mutate({
            mutation: useFileExportTask_createFileExportTaskDocument,
            variables: { petitionId, integrationId, pattern },
          });

          if (isNullish(data)) {
            throw new Error();
          }

          return data.createFileExportTask;
        },
        dialogHeader: intl.formatMessage({
          id: "util.use-file-export-task.header",
          defaultMessage: "Exporting replies...",
        }),
        confirmText: intl.formatMessage(
          {
            id: "util.use-file-export-task.continue-button",
            defaultMessage: "Continue to {provider}",
          },
          { provider: "iManage" },
        ),
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
        }),
      );
    } else if (!taskError) {
      // To check the progress
      /* const { data } = await apollo.query({
        query: useFileExportTask_fileExportLogDocument,
        variables: { fileExportLogId: finishedTask.output.fileExportLogId, integrationId },
      });
      return data!.fileExportLog.id;
      */

      const [error] = await withError(
        openNewWindow(finishedTask.output.windowUrl, { popup: true }),
      );
      if (error && !isWindowBlockedError(error)) {
        await withError(
          showError({
            message: intl.formatMessage({
              id: "generic.unexpected-error-happened",
              defaultMessage:
                "An unexpected error happened. Please try refreshing your browser window and, if it persists, reach out to support for help.",
            }),
          }),
        );
      }
    }
  };
}

useFileExportTask.mutations = [
  gql`
    mutation useFileExportTask_createFileExportTask(
      $petitionId: GID!
      $integrationId: GID!
      $pattern: String
    ) {
      createFileExportTask(
        petitionId: $petitionId
        integrationId: $integrationId
        pattern: $pattern
      ) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
];
