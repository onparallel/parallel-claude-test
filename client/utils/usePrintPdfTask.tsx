import { gql } from "@apollo/client";
import { useDialog } from "@parallel/components/common/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/ErrorDialog";
import { TaskProgressDialog } from "@parallel/components/common/TaskProgressDialog";
import {
  usePrintPdfTask_createPrintPdfTaskMutation,
  usePrintPdfTask_getTaskResultFileUrlMutation,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { openNewWindow } from "./openNewWindow";
import { withError } from "./promises/withError";

export function usePrintPdfTask() {
  const showError = useErrorDialog();
  const [createTask] = usePrintPdfTask_createPrintPdfTaskMutation();
  const [generateDownloadURL] = usePrintPdfTask_getTaskResultFileUrlMutation();

  const showTaskProgressDialog = useDialog(TaskProgressDialog);
  const intl = useIntl();

  return async (petitionId: string) => {
    const [error, finishedTask] = await withError(async () => {
      const { data } = await createTask({ variables: { petitionId } });
      return await showTaskProgressDialog({
        task: data!.createPrintPdfTask,
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
        const { data } = await generateDownloadURL({ variables: { taskId: finishedTask!.id } });
        return data!.getTaskResultFileUrl;
      });
    }
  };
}

usePrintPdfTask.mutations = [
  gql`
    mutation PrintPdfTask_createPrintPdfTask($petitionId: GID!) {
      createPrintPdfTask(petitionId: $petitionId) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
  gql`
    mutation PrintPdfTask_getTaskResultFileUrl($taskId: GID!) {
      getTaskResultFileUrl(taskId: $taskId, preview: true)
    }
  `,
];
