import { gql, useMutation, useQuery } from "@apollo/client";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  TaskProgressDialog,
  useTaskProgressDialog,
} from "@parallel/components/common/dialogs/TaskProgressDialog";
import {
  usePublicPrintPdfTask_publicCreatePrintPdfTaskDocument,
  usePublicPrintPdfTask_publicGetTaskResultFileUrlDocument,
  usePublicPrintPdfTask_publicTaskDocument,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { openNewWindow } from "./openNewWindow";
import { withError } from "./promises/withError";

export function usePublicPrintPdfTask() {
  const intl = useIntl();
  const showError = useErrorDialog();
  const showTaskProgressDialog = useTaskProgressDialog();

  const [publicCreatePrintPdfTask] = useMutation(
    usePublicPrintPdfTask_publicCreatePrintPdfTaskDocument
  );
  const [publicGetTaskResultFileUrl] = useMutation(
    usePublicPrintPdfTask_publicGetTaskResultFileUrlDocument
  );
  const { refetch } = useQuery(usePublicPrintPdfTask_publicTaskDocument, { skip: true });

  return async (keycode: string) => {
    const [error, finishedTask] = await withError(async () => {
      const { data } = await publicCreatePrintPdfTask({
        variables: { keycode },
      });
      return await showTaskProgressDialog({
        task: data!.publicCreatePrintPdfTask,
        refetch: async () => {
          const { data: refetchData } = await refetch({
            keycode,
            taskId: data!.publicCreatePrintPdfTask.id,
          });
          return refetchData.task;
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
    } else {
      openNewWindow(async () => {
        const { data } = await publicGetTaskResultFileUrl({
          variables: { taskId: finishedTask!.id, keycode },
        });
        if (!data?.publicGetTaskResultFileUrl) {
          throw new Error();
        }
        return data.publicGetTaskResultFileUrl;
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

usePublicPrintPdfTask.queries = [
  gql`
    query usePublicPrintPdfTask_publicTask($taskId: GID!, $keycode: ID!) {
      task: publicTask(taskId: $taskId, keycode: $keycode) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
];
