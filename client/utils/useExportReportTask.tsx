import { gql, useMutation, useQuery } from "@apollo/client";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  TaskProgressDialog,
  useTaskProgressDialog,
} from "@parallel/components/common/dialogs/TaskProgressDialog";
import {
  useExportReportTask_createExportReportTaskDocument,
  useExportReportTask_getTaskResultFileUrlDocument,
  useExportReportTask_taskDocument,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { openNewWindow } from "./openNewWindow";
import { withError } from "./promises/withError";

export function useExportReportTask() {
  const showError = useErrorDialog();
  const [createTask] = useMutation(useExportReportTask_createExportReportTaskDocument);
  const [generateDownloadUrl] = useMutation(useExportReportTask_getTaskResultFileUrlDocument);

  const showTaskProgressDialog = useTaskProgressDialog();
  const intl = useIntl();

  const { refetch } = useQuery(useExportReportTask_taskDocument, { skip: true });

  return async (petitionId: string) => {
    const [error, finishedTask] = await withError(async () => {
      const { data } = await createTask({
        variables: { petitionId, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      });
      return await showTaskProgressDialog({
        task: data!.createExportReportTask,
        refetch: async () => {
          const { data: refetchData } = await refetch({
            id: data!.createExportReportTask.id,
          });
          return refetchData.task;
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

useExportReportTask.queries = [
  gql`
    query useExportReportTask_task($id: GID!) {
      task(id: $id) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
];
