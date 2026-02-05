import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { BaseModalProps } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { useTaskProgressDialog } from "@parallel/components/common/dialogs/TaskProgressDialog";
import { Text } from "@parallel/components/ui";
import { useProfilesExcelImportTask_createProfilesExcelImportTaskDocument } from "@parallel/graphql/__types";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { letters, nth } from "../generators";
import { withError } from "../promises/withError";

interface ErrorCell {
  row: number;
  col: number;
}

export function useProfilesExcelImportTask() {
  const apollo = useApolloClient();
  const showError = useErrorDialog();

  const showTaskProgressDialog = useTaskProgressDialog();
  const intl = useIntl();

  const [isLoading, setIsLoading] = useState(false);

  const showErrorDialog = useErrorDialog();

  async function showImportErrorDialog(cell?: ErrorCell) {
    return await withError(
      showErrorDialog({
        header: <FormattedMessage id="generic.import-error" defaultMessage="Import error" />,
        message: (
          <>
            {cell ? (
              <Text marginBottom={2}>
                <FormattedMessage
                  id="component.import-profiles-from-excel-dialog.import-error-details"
                  defaultMessage="We have detected an error in cell {col}{row}."
                  values={{ row: cell.row, col: nth(letters(), cell.col - 1) }}
                />
              </Text>
            ) : null}
            <Text>
              <FormattedMessage
                id="component.import-profiles-from-excel-dialog.import-error-body"
                defaultMessage="Please, review your file and make sure it matches the format on the loading model."
              />
            </Text>
          </>
        ),
      }),
    );
  }

  async function showRowLimitReachedDialog(limit: number) {
    return await withError(
      showErrorDialog({
        header: <FormattedMessage id="generic.import-error" defaultMessage="Import error" />,
        message: (
          <Text>
            <FormattedMessage
              id="component.import-profiles-from-excel-dialog.row-limit-reached"
              defaultMessage="The file you are trying to import exceeds the maximum number of profiles ({limit}). Please, remove some rows until you reach that limit and try again."
              values={{ limit: intl.formatNumber(limit) }}
            />
          </Text>
        ),
      }),
    );
  }

  return [
    async (
      variables: { profileTypeId: string; file: File },
      { modalProps }: { modalProps?: BaseModalProps } = {},
    ) => {
      const [taskError, taskResult] = await withError(async () => {
        return await showTaskProgressDialog({
          onCompleted: async (task) => {
            if (!task.output.success && isNonNullish(task.output.error)) {
              const code = task.output.error.code;
              if (code === "INVALID_FILE_ERROR") {
                await withError(showImportErrorDialog());
              }
              if (code === "INVALID_CELL_ERROR") {
                const cell = task.output.error.cell as ErrorCell;
                await withError(showImportErrorDialog(cell));
              }
              if (code === "ROW_LIMIT_REACHED") {
                await withError(showRowLimitReachedDialog(task.output.error.limit));
              }
            }
          },
          initTask: async () => {
            setIsLoading(true);
            try {
              const { data } = await apollo.mutate({
                mutation: useProfilesExcelImportTask_createProfilesExcelImportTaskDocument,
                variables,
              });

              if (isNullish(data)) {
                throw new Error();
              }
              return data.createProfilesExcelImportTask;
            } catch {
              throw new Error("SERVER_ERROR");
            }
          },
          dialogHeader: intl.formatMessage({
            id: "component.profiles-excel-import.header",
            defaultMessage: "Importing profiles...",
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
      }

      return taskResult?.output;
    },
    { loading: isLoading },
  ] as const;
}

useProfilesExcelImportTask.mutations = [
  gql`
    mutation useProfilesExcelImportTask_createProfilesExcelImportTask(
      $profileTypeId: GID!
      $file: Upload!
    ) {
      createProfilesExcelImportTask(profileTypeId: $profileTypeId, file: $file) {
        ...TaskProgressDialog_Task
      }
    }
  `,
];
