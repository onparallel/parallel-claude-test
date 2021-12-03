import { gql, useQuery } from "@apollo/client";
import { Button, Progress } from "@chakra-ui/react";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  TaskProgressDialog_TaskDocument,
  TaskProgressDialog_TaskFragment,
} from "@parallel/graphql/__types";
import { useInterval } from "@parallel/utils/useInterval";
import { ReactNode, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { ConfirmDialog } from "./ConfirmDialog";

interface TaskProgressDialogProps {
  confirmText?: ReactNode;
  dialogHeader?: ReactNode;
  pollInterval?: number;
  task: TaskProgressDialog_TaskFragment;
}
export function TaskProgressDialog({
  confirmText,
  dialogHeader,
  pollInterval,
  task,
  ...props
}: DialogProps<TaskProgressDialogProps, TaskProgressDialog_TaskFragment>) {
  const { data, refetch } = useQuery(TaskProgressDialog_TaskDocument, {
    variables: { id: task.id },
  });
  const processingTask = data?.task ?? task;

  useInterval(
    async (done) => {
      try {
        const { data: updatedData } = await refetch();
        if (updatedData.task.status === "COMPLETED") {
          done();
        } else if (updatedData.task.status === "FAILED") {
          done();
          props.onReject("SERVER_ERROR");
        }
      } catch {
        done();
        props.onReject("SERVER_ERROR");
      }
    },
    pollInterval || 1000,
    []
  );
  const confirmRef = useRef<HTMLButtonElement>(null);

  return (
    <ConfirmDialog
      {...props}
      initialFocusRef={confirmRef}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      header={
        dialogHeader ?? (
          <FormattedMessage
            id="component.task-progress-dialog.unknown-task.header"
            defaultMessage="Please wait..."
          />
        )
      }
      body={
        <Progress
          size="md"
          value={processingTask.progress ?? 0}
          colorScheme="green"
          borderRadius="full"
          isIndeterminate={processingTask.status === "ENQUEUED"}
        />
      }
      confirm={
        <Button
          ref={confirmRef}
          colorScheme="purple"
          isDisabled={processingTask.status !== "COMPLETED"}
          onClick={() => props.onResolve(processingTask)}
        >
          {confirmText ?? (
            <FormattedMessage
              id="component.task-progress-dialog.unknown-task.confirm"
              defaultMessage="Get result"
            />
          )}
        </Button>
      }
    />
  );
}

TaskProgressDialog.fragments = {
  Task: gql`
    fragment TaskProgressDialog_Task on Task {
      id
      status
      progress
    }
  `,
};

TaskProgressDialog.queries = [
  gql`
    query TaskProgressDialog_Task($id: GID!) {
      task(id: $id) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
];

export function useTaskProgressDialog() {
  return useDialog(TaskProgressDialog);
}
