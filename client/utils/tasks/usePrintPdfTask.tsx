import { gql } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { BaseModalProps } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  TaskProgressDialog,
  useTaskProgressDialog,
} from "@parallel/components/common/dialogs/TaskProgressDialog";
import {
  usePrintPdfTask_createPrintPdfTaskDocument,
  usePrintPdfTask_createPrintPdfTaskMutationVariables,
  usePrintPdfTask_getTaskResultFileDocument,
  usePrintPdfTask_taskDocument,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { assert } from "ts-essentials";
import { isWindowBlockedError, openNewWindow } from "../openNewWindow";
import { waitFor } from "../promises/waitFor";
import { withError } from "../promises/withError";
import { BackgroundTaskOptions } from "./backgroundTaskOptions";

export function usePrintPdfTask() {
  const apollo = useApolloClient();
  const showError = useErrorDialog();
  const [getTaskResultFile] = useMutation(usePrintPdfTask_getTaskResultFileDocument);

  const showTaskProgressDialog = useTaskProgressDialog();
  const intl = useIntl();

  return async (petitionId: string, { modalProps }: { modalProps?: BaseModalProps } = {}) => {
    const [taskError, finishedTask] = await withError(async () => {
      return await showTaskProgressDialog({
        initTask: async () => {
          const { data } = await apollo.mutate({
            mutation: usePrintPdfTask_createPrintPdfTaskDocument,
            variables: { petitionId },
          });
          if (isNullish(data)) {
            throw new Error();
          }
          return data.createPrintPdfTask;
        },
        dialogHeader: intl.formatMessage({
          id: "component.print-pdf-task.header",
          defaultMessage: "Generating PDF file...",
        }),
        confirmText: intl.formatMessage({
          id: "component.print-pdf-task.confirm",
          defaultMessage: "Download PDF",
        }),
        modalProps,
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

export function usePrintPdfBackgroundTask() {
  const apollo = useApolloClient();
  const [createPrintPdfTask] = useMutation(usePrintPdfTask_createPrintPdfTaskDocument);
  const [getTaskResultFile] = useMutation(usePrintPdfTask_getTaskResultFileDocument);

  return useCallback(
    async (
      variables: usePrintPdfTask_createPrintPdfTaskMutationVariables,
      { signal, timeout = 60_000, pollingInterval = 3_000 }: BackgroundTaskOptions = {},
    ) => {
      const { data: initialData } = await createPrintPdfTask({ variables });

      const task = await (async function () {
        const startTime = performance.now();
        while (true) {
          if (signal?.aborted) {
            throw new Error("ABORTED");
          }
          if (performance.now() - startTime > timeout) {
            throw new Error("TIMEOUT");
          }
          const { data } = await apollo.query({
            query: usePrintPdfTask_taskDocument,
            variables: { id: initialData!.createPrintPdfTask.id },
            fetchPolicy: "network-only",
          });

          assert(isNonNullish(data), "Result data in usePrintPdfTask_taskDocument is missing");

          if (data.task.status === "COMPLETED") {
            return data.task;
          } else if (data.task.status === "FAILED") {
            throw new Error("FAILED");
          }

          await waitFor(pollingInterval);
        }
      })();

      const { data } = await getTaskResultFile({ variables: { taskId: task!.id } });
      return {
        url: data!.getTaskResultFile.url,
        filename: data!.getTaskResultFile.filename,
      };
    },
    [],
  );
}

usePrintPdfTask.mutations = [
  gql`
    mutation usePrintPdfTask_createPrintPdfTask($petitionId: GID!) {
      createPrintPdfTask(petitionId: $petitionId) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
  gql`
    mutation usePrintPdfTask_getTaskResultFile($taskId: GID!) {
      getTaskResultFile(taskId: $taskId, preview: true) {
        url
        filename
      }
    }
  `,
];

const _queries = [
  gql`
    query usePrintPdfTask_task($id: GID!) {
      task(id: $id) {
        id
        status
        output
      }
    }
  `,
];
