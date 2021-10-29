import { gql } from "@apollo/client";
import { useDialog } from "@parallel/components/common/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/ErrorDialog";
import { TaskProgressDialog } from "@parallel/components/common/TaskProgressDialog";
import { usePrintPdfTask_createPrintPdfTaskMutation } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { withError } from "./promises/withError";

export function usePrintPdfTask() {
  const [createTask] = usePrintPdfTask_createPrintPdfTaskMutation();
  const showTaskProgressDialog = useDialog(TaskProgressDialog);
  const showErrorDialog = useErrorDialog();
  const intl = useIntl();

  return async (petitionId: string) => {
    const { data } = await createTask({ variables: { petitionId } });
    const [error, output] = await withError<Error, { url: string }>(
      showTaskProgressDialog({
        task: data!.createPrintPdfTask,
        dialogHeader: intl.formatMessage({
          id: "component.task-progress-dialog.print-pdf.header",
          defaultMessage: "Generating PDF file...",
        }),
      })
    );

    if (error?.message === "SERVER_ERROR") {
      await showErrorDialog({
        message: intl.formatMessage({
          id: "component.task-progress-dialog.server-error",
          defaultMessage: "An unexpected error happened, please try again.",
        }),
      });
    } else {
      if (output) {
        window.open(output.url, "_blank");
      }
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
];
