import { gql } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { useTaskProgressDialog } from "@parallel/components/common/dialogs/TaskProgressDialog";
import {
  useDowJonesProfileDownloadTask_createDowJonesProfileDownloadTaskDocument,
  useDowJonesProfileDownloadTask_getTaskResultFileDocument,
} from "@parallel/graphql/__types";

import { useIntl } from "react-intl";
import { isNullish } from "remeda";
import { isWindowBlockedError, openNewWindow } from "../openNewWindow";
import { withError } from "../promises/withError";

export function useDowJonesProfileDownloadTask() {
  const apollo = useApolloClient();
  const showError = useErrorDialog();
  const [getTaskResultFile] = useMutation(useDowJonesProfileDownloadTask_getTaskResultFileDocument);

  const showTaskProgressDialog = useTaskProgressDialog();
  const intl = useIntl();

  return async (profileId: string) => {
    const [taskError, finishedTask] = await withError(async () => {
      return await showTaskProgressDialog({
        initTask: async () => {
          const { data } = await apollo.mutate({
            mutation: useDowJonesProfileDownloadTask_createDowJonesProfileDownloadTaskDocument,
            variables: { profileId },
          });
          if (isNullish(data)) {
            throw new Error();
          }
          return data.createDowJonesProfileDownloadTask;
        },
        dialogHeader: intl.formatMessage({
          id: "component.dowjones-profile-download-task.header",
          defaultMessage: "Generating PDF file...",
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
        }),
      );
    } else if (!taskError) {
      const [error] = await withError(
        openNewWindow(async () => {
          const { data } = await getTaskResultFile({
            variables: { taskId: finishedTask!.id },
          });
          return data!.getTaskResultFile.url;
        }),
      );

      if (error && !isWindowBlockedError(error)) {
        await withError(
          showError({
            message: intl.formatMessage({
              id: "generic.unexpected-error-happened",
              defaultMessage:
                "An unexpected error happened. Please try refreshing your browser window and, if it persists, reach out to support for help.",
            }),
          }),
        );
      }
    }
  };
}

useDowJonesProfileDownloadTask.mutations = [
  gql`
    mutation useDowJonesProfileDownloadTask_createDowJonesProfileDownloadTask($profileId: ID!) {
      createDowJonesProfileDownloadTask(profileId: $profileId) {
        ...TaskProgressDialog_Task
      }
    }
  `,
  gql`
    mutation useDowJonesProfileDownloadTask_getTaskResultFile($taskId: GID!) {
      getTaskResultFile(taskId: $taskId, preview: true) {
        url
      }
    }
  `,
];
