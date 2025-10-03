import { gql, useApolloClient, useMutation } from "@apollo/client";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  TaskProgressDialog,
  useTaskProgressDialog,
} from "@parallel/components/common/dialogs/TaskProgressDialog";
import {
  BackgroundCheckEntitySearchType,
  useBackgroundCheckResultsDownloadTask_createBackgroundCheckResultsPdfTaskDocument,
  useBackgroundCheckResultsDownloadTask_getTaskResultFileDocument,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { isNullish } from "remeda";
import { isWindowBlockedError, openNewWindow } from "../openNewWindow";
import { withError } from "../promises/withError";

export function useBackgroundCheckResultsDownloadTask() {
  const apollo = useApolloClient();
  const showError = useErrorDialog();
  const [getTaskResultFile] = useMutation(
    useBackgroundCheckResultsDownloadTask_getTaskResultFileDocument,
  );

  const showTaskProgressDialog = useTaskProgressDialog();

  const intl = useIntl();

  return async ({
    token,
    name,
    date,
    type,
    country,
    birthCountry,
  }: {
    token: string;
    name: string;
    date?: string | null;
    type: BackgroundCheckEntitySearchType | null;
    country?: string | null;
    birthCountry?: string | null;
  }) => {
    const [taskError, finishedTask] = await withError(async () => {
      return await showTaskProgressDialog({
        initTask: async () => {
          const { data } = await apollo.mutate({
            mutation:
              useBackgroundCheckResultsDownloadTask_createBackgroundCheckResultsPdfTaskDocument,
            variables: { token, name, date, type, country, birthCountry },
          });
          if (isNullish(data)) {
            throw new Error();
          }
          return data.createBackgroundCheckResultsPdfTask;
        },
        dialogHeader: intl.formatMessage({
          id: "component.background-check-results-download-task.header",
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

useBackgroundCheckResultsDownloadTask.mutations = [
  gql`
    mutation useBackgroundCheckResultsDownloadTask_createBackgroundCheckResultsPdfTask(
      $token: String!
      $name: String!
      $date: String
      $type: BackgroundCheckEntitySearchType
      $country: String
      $birthCountry: String
    ) {
      createBackgroundCheckResultsPdfTask(
        token: $token
        name: $name
        date: $date
        type: $type
        country: $country
        birthCountry: $birthCountry
      ) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
  gql`
    mutation useBackgroundCheckResultsDownloadTask_getTaskResultFile($taskId: GID!) {
      getTaskResultFile(taskId: $taskId, preview: true) {
        url
      }
    }
  `,
];
