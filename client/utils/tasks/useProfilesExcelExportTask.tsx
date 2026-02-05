import { gql } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { BaseModalProps } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { useTaskProgressDialog } from "@parallel/components/common/dialogs/TaskProgressDialog";
import {
  useProfilesExcelExportTask_createProfilesExcelExportTaskDocument,
  useProfilesExcelExportTask_createProfilesExcelExportTaskMutationVariables,
  useProfilesExcelExportTask_getTaskResultFileDocument,
} from "@parallel/graphql/__types";
import { useState } from "react";
import { useIntl } from "react-intl";
import { isNullish } from "remeda";
import { isWindowBlockedError, openNewWindow } from "../openNewWindow";
import { withError } from "../promises/withError";

export function useProfilesExcelExportTask() {
  const apollo = useApolloClient();
  const showError = useErrorDialog();

  const showTaskProgressDialog = useTaskProgressDialog();
  const intl = useIntl();

  const [isLoading, setIsLoading] = useState(false);

  const [getTaskResultFile] = useMutation(useProfilesExcelExportTask_getTaskResultFileDocument);

  return [
    async (
      variables: useProfilesExcelExportTask_createProfilesExcelExportTaskMutationVariables,
      { modalProps }: { modalProps?: BaseModalProps } = {},
    ) => {
      const [taskError, taskResult] = await withError(async () => {
        return await showTaskProgressDialog({
          initTask: async () => {
            setIsLoading(true);
            try {
              const { data } = await apollo.mutate({
                mutation: useProfilesExcelExportTask_createProfilesExcelExportTaskDocument,
                variables,
              });

              if (isNullish(data)) {
                throw new Error();
              }
              return data.createProfilesExcelExportTask;
            } catch {
              throw new Error("SERVER_ERROR");
            }
          },
          dialogHeader: intl.formatMessage({
            id: "component.profiles-excel-export.header",
            defaultMessage: "Exporting profiles...",
          }),
          modalProps,
        });
      });

      setIsLoading(false);

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
              variables: { taskId: taskResult!.id },
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
    },
    { loading: isLoading },
  ] as const;
}

useProfilesExcelExportTask.mutations = [
  gql`
    mutation useProfilesExcelExportTask_createProfilesExcelExportTask(
      $profileTypeId: GID!
      $locale: UserLocale!
      $filter: ProfileQueryFilterInput
      $search: String
      $sortBy: [String!]
    ) {
      createProfilesExcelExportTask(
        profileTypeId: $profileTypeId
        locale: $locale
        filter: $filter
        search: $search
        sortBy: $sortBy
      ) {
        ...TaskProgressDialog_Task
      }
    }
  `,
  gql`
    mutation useProfilesExcelExportTask_getTaskResultFile($taskId: GID!) {
      getTaskResultFile(taskId: $taskId, preview: true) {
        url
        filename
      }
    }
  `,
];
