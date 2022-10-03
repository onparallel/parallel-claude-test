import { gql, useApolloClient, useMutation } from "@apollo/client";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  TaskProgressDialog,
  useTaskProgressDialog,
} from "@parallel/components/common/dialogs/TaskProgressDialog";
import {
  useTemplateRepliesReportTask_createTemplateRepliesReportTaskDocument,
  useTemplateRepliesReportTask_getTaskResultFileDocument,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";
import { openNewWindow } from "./openNewWindow";
import { withError } from "./promises/withError";
import { Maybe } from "./types";

export function useTemplateRepliesReportTask() {
  const apollo = useApolloClient();
  const showError = useErrorDialog();
  const [getTaskResultFile] = useMutation(useTemplateRepliesReportTask_getTaskResultFileDocument);

  const showTaskProgressDialog = useTaskProgressDialog();
  const intl = useIntl();

  return async (petitionId: string, startDate?: Maybe<string>, endDate?: Maybe<string>) => {
    const [taskError, finishedTask] = await withError(async () => {
      return await showTaskProgressDialog({
        initTask: async () => {
          const { data } = await apollo.mutate({
            mutation: useTemplateRepliesReportTask_createTemplateRepliesReportTaskDocument,
            variables: {
              petitionId,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              startDate,
              endDate,
            },
          });
          if (!isDefined(data)) {
            throw new Error();
          }
          return data.createTemplateRepliesReportTask;
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

useTemplateRepliesReportTask.mutations = [
  gql`
    mutation useTemplateRepliesReportTask_createTemplateRepliesReportTask(
      $petitionId: GID!
      $timezone: String!
      $startDate: DateTime
      $endDate: DateTime
    ) {
      createTemplateRepliesReportTask(
        petitionId: $petitionId
        timezone: $timezone
        startDate: $startDate
        endDate: $endDate
      ) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
  gql`
    mutation useTemplateRepliesReportTask_getTaskResultFile($taskId: GID!) {
      getTaskResultFile(taskId: $taskId, preview: true) {
        url
      }
    }
  `,
];
