import { gql } from "@apollo/client";
import { useDialog } from "@parallel/components/common/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/ErrorDialog";
import { TaskProgressDialog } from "@parallel/components/common/TaskProgressDialog";
import { useExportRepliesTask_createExportRepliesTaskMutation } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { withError } from "./promises/withError";
import { Maybe } from "./types";

export function useExportRepliesTask() {
  const [createTask] = useExportRepliesTask_createExportRepliesTaskMutation();
  const showTaskProgressDialog = useDialog(TaskProgressDialog);
  const showErrorDialog = useErrorDialog();
  const intl = useIntl();

  return async (petitionId: string, pattern?: Maybe<string>) => {
    const { data } = await createTask({ variables: { petitionId, pattern } });
    const [error, output] = await withError<Error, { url: string }>(
      showTaskProgressDialog({
        task: data!.createExportRepliesTask,
        dialogHeader: intl.formatMessage({
          id: "component.task-progress-dialog.export-replies.header",
          defaultMessage: "Exporting replies...",
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
        window.open(output.url);
      }
    }
  };
}

useExportRepliesTask.mutations = [
  gql`
    mutation ExportRepliesTask_createExportRepliesTask($petitionId: GID!, $pattern: String) {
      createExportRepliesTask(petitionId: $petitionId, pattern: $pattern) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
];
