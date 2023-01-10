import { gql, useApolloClient, useMutation } from "@apollo/client";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { useTaskProgressDialog } from "@parallel/components/common/dialogs/TaskProgressDialog";
import {
  useTemplatesOverviewExportTask_createTemplatesOverviewExportTaskDocument,
  useTemplatesOverviewExportTask_getTaskResultFileDocument,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";
import { openNewWindow } from "../openNewWindow";
import { withError } from "../promises/withError";
import { Maybe } from "../types";

export function useTemplatesOverviewExportTask() {
  const apollo = useApolloClient();
  const showError = useErrorDialog();
  const [getTaskResultFile] = useMutation(useTemplatesOverviewExportTask_getTaskResultFileDocument);

  const showTaskProgressDialog = useTaskProgressDialog();
  const intl = useIntl();

  return async (startDate?: Maybe<string>, endDate?: Maybe<string>) => {
    const [taskError, finishedTask] = await withError(async () => {
      return await showTaskProgressDialog({
        initTask: async () => {
          const { data } = await apollo.mutate({
            mutation: useTemplatesOverviewExportTask_createTemplatesOverviewExportTaskDocument,
            variables: { startDate, endDate },
          });
          if (!isDefined(data)) {
            throw new Error();
          }
          return data.createTemplatesOverviewExportTask;
        },
        dialogHeader: intl.formatMessage({
          id: "component.templates-overview-export-task.header",
          defaultMessage: "Generating report...",
        }),
        confirmText: intl.formatMessage({
          id: "generic.download",
          defaultMessage: "Download",
        }),
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
        })
      );
    } else if (!taskError) {
      const [error] = await withError(
        openNewWindow(async () => {
          const { data } = await getTaskResultFile({
            variables: { taskId: finishedTask!.id },
          });
          return data!.getTaskResultFile.url;
        })
      );

      if (error) {
        await withError(
          showError({
            message: intl.formatMessage({
              id: "generic.unexpected-error-happened",
              defaultMessage:
                "An unexpected error happened. Please try refreshing your browser window and, if it persists, reach out to support for help.",
            }),
          })
        );
      }
    }
  };
}

const fragments = {
  Task: gql`
    fragment useTemplatesOverviewExportTask_Task on Task {
      id
      status
      output
    }
  `,
};

const _mutations = [
  gql`
    mutation useTemplatesOverviewExportTask_createTemplatesOverviewExportTask(
      $startDate: DateTime
      $endDate: DateTime
    ) {
      createTemplatesOverviewExportTask(startDate: $startDate, endDate: $endDate) {
        ...useTemplatesOverviewExportTask_Task
      }
    }
    ${fragments.Task}
  `,
  gql`
    mutation useTemplatesOverviewExportTask_getTaskResultFile($taskId: GID!) {
      getTaskResultFile(taskId: $taskId, preview: true) {
        url
        filename
      }
    }
  `,
];

const _queries = [
  gql`
    query useTemplatesOverviewExportTask_task($id: GID!) {
      task(id: $id) {
        ...useTemplatesOverviewExportTask_Task
      }
    }
    ${fragments.Task}
  `,
];
