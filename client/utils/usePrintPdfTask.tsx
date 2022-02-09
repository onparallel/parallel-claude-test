import { gql, useMutation, useQuery } from "@apollo/client";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  TaskProgressDialog,
  useTaskProgressDialog,
} from "@parallel/components/common/dialogs/TaskProgressDialog";
import {
  usePrintPdfTask_createPrintPdfTaskDocument,
  usePrintPdfTask_getTaskResultFileUrlDocument,
  usePrintPdfTask_taskDocument,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { openNewWindow } from "./openNewWindow";
import { withError } from "./promises/withError";

export function usePrintPdfTask() {
  const showError = useErrorDialog();
  const [createTask] = useMutation(usePrintPdfTask_createPrintPdfTaskDocument);
  const [generateDownloadUrl] = useMutation(usePrintPdfTask_getTaskResultFileUrlDocument);

  const showTaskProgressDialog = useTaskProgressDialog();
  const intl = useIntl();

  const { refetch } = useQuery(usePrintPdfTask_taskDocument, { skip: true });

  return async (petitionId: string) => {
    const [error, finishedTask] = await withError(async () => {
      const { data } = await createTask({ variables: { petitionId } });
      return await showTaskProgressDialog({
        task: data!.createPrintPdfTask,
        refetch: async () => {
          const { data: refetchData } = await refetch({
            id: data!.createPrintPdfTask.id,
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

usePrintPdfTask.queries = [
  gql`
    query usePrintPdfTask_task($id: GID!) {
      task(id: $id) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
];
