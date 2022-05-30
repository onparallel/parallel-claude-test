import { gql, useApolloClient, useMutation } from "@apollo/client";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  TaskProgressDialog,
  useTaskProgressDialog,
} from "@parallel/components/common/dialogs/TaskProgressDialog";
import {
  usePrintPdfTask_createPrintPdfTaskDocument,
  usePrintPdfTask_getTaskResultFileUrlDocument,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";
import { openNewWindow } from "./openNewWindow";
import { withError } from "./promises/withError";

export function usePrintPdfTask() {
  const apollo = useApolloClient();
  const showError = useErrorDialog();
  const [generateDownloadUrl] = useMutation(usePrintPdfTask_getTaskResultFileUrlDocument);

  const showTaskProgressDialog = useTaskProgressDialog();
  const intl = useIntl();

  return async (petitionId: string) => {
    const [error, finishedTask] = await withError(async () => {
      return await showTaskProgressDialog({
        initTask: async () => {
          const { data } = await apollo.mutate({
            mutation: usePrintPdfTask_createPrintPdfTaskDocument,
            variables: { petitionId },
          });
          if (!isDefined(data)) {
            throw new Error();
          }
          return data.createPrintPdfTask;
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
          const { data } = await generateDownloadUrl({
            variables: { taskId: finishedTask!.id },
          });
          if (!data?.getTaskResultFileUrl) {
            throw new Error();
          }
          return data.getTaskResultFileUrl;
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

usePrintPdfTask.mutations = [
  gql`
    mutation usePrintPdfTask_createPrintPdfTask($petitionId: GID!) {
      createPrintPdfTask(petitionId: $petitionId) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
  gql`
    mutation usePrintPdfTask_getTaskResultFileUrl($taskId: GID!) {
      getTaskResultFileUrl(taskId: $taskId, preview: true)
    }
  `,
];
