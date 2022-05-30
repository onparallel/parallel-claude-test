import { gql, useApolloClient, useMutation } from "@apollo/client";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  TaskProgressDialog,
  useTaskProgressDialog,
} from "@parallel/components/common/dialogs/TaskProgressDialog";
import {
  useExportReportTask_createExportReportTaskDocument,
  useExportReportTask_getTaskResultFileUrlDocument,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";
import { openNewWindow } from "./openNewWindow";
import { withError } from "./promises/withError";

export function useExportReportTask() {
  const apollo = useApolloClient();
  const showError = useErrorDialog();
  const [generateDownloadUrl] = useMutation(useExportReportTask_getTaskResultFileUrlDocument);

  const showTaskProgressDialog = useTaskProgressDialog();
  const intl = useIntl();

  return async (petitionId: string) => {
    const [error, finishedTask] = await withError(async () => {
      return await showTaskProgressDialog({
        initTask: async () => {
          const { data } = await apollo.mutate({
            mutation: useExportReportTask_createExportReportTaskDocument,
            variables: { petitionId, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          });
          if (!isDefined(data)) {
            throw new Error();
          }
          return data.createExportReportTask;
        },
        dialogHeader: intl.formatMessage({
          id: "component.export-report-task.header",
          defaultMessage: "Generating report...",
        }),
        confirmText: intl.formatMessage({
          id: "generic.download",
          defaultMessage: "Download",
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

useExportReportTask.mutations = [
  gql`
    mutation useExportReportTask_createExportReportTask($petitionId: GID!, $timezone: String!) {
      createExportReportTask(petitionId: $petitionId, timezone: $timezone) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
  gql`
    mutation useExportReportTask_getTaskResultFileUrl($taskId: GID!) {
      getTaskResultFileUrl(taskId: $taskId, preview: true)
    }
  `,
];
