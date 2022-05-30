import { gql, useApolloClient, useMutation } from "@apollo/client";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  TaskProgressDialog,
  useTaskProgressDialog,
} from "@parallel/components/common/dialogs/TaskProgressDialog";
import {
  usePublicPrintPdfTask_publicCreatePrintPdfTaskDocument,
  usePublicPrintPdfTask_publicGetTaskResultFileUrlDocument,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";
import { openNewWindow } from "./openNewWindow";
import { withError } from "./promises/withError";

export function usePublicPrintPdfTask() {
  const intl = useIntl();
  const apollo = useApolloClient();
  const showError = useErrorDialog();
  const showTaskProgressDialog = useTaskProgressDialog();

  const [publicGetTaskResultFileUrl] = useMutation(
    usePublicPrintPdfTask_publicGetTaskResultFileUrlDocument
  );

  return async (keycode: string) => {
    const [error, finishedTask] = await withError(async () => {
      return await showTaskProgressDialog({
        keycode,
        initTask: async () => {
          const { data } = await apollo.mutate({
            mutation: usePublicPrintPdfTask_publicCreatePrintPdfTaskDocument,
            variables: { keycode },
          });
          if (!isDefined(data)) {
            throw new Error();
          }
          return data.publicCreatePrintPdfTask;
        },
        dialogHeader: intl.formatMessage({
          id: "component.print-pdf-task.header",
          defaultMessage: "Generating PDF file...",
        }),
        confirmText: intl.formatMessage({
          id: "component.print-pdf-task.confirm",
          defaultMessage: "Download PDF",
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
        try {
          const { data } = await publicGetTaskResultFileUrl({
            variables: { taskId: finishedTask!.id, keycode },
          });
          if (!data?.publicGetTaskResultFileUrl) {
            throw new Error();
          }
          return data.publicGetTaskResultFileUrl;
        } catch (error) {
          // don't await this. we want to immediately rethrow the error so the new window is closed
          showError({
            message: intl.formatMessage({
              id: "generic.unexpected-error-happened",
              defaultMessage:
                "An unexpected error happened. Please try refreshing your browser window and, if it persists, reach out to support for help.",
            }),
          });
          throw error;
        }
      });
    }
  };
}

usePublicPrintPdfTask.mutations = [
  gql`
    mutation usePublicPrintPdfTask_publicCreatePrintPdfTask($keycode: ID!) {
      publicCreatePrintPdfTask(keycode: $keycode) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
  gql`
    mutation usePublicPrintPdfTask_publicGetTaskResultFileUrl($taskId: GID!, $keycode: ID!) {
      publicGetTaskResultFileUrl(taskId: $taskId, keycode: $keycode)
    }
  `,
];
