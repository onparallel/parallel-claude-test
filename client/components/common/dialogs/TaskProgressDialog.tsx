import { gql } from "@apollo/client";
import { Button, Progress } from "@chakra-ui/react";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { TaskProgressDialog_TaskFragment } from "@parallel/graphql/__types";
import { useInterval } from "@parallel/utils/useInterval";
import { ReactNode, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { ConfirmDialog } from "./ConfirmDialog";

interface TaskProgressDialogProps {
  confirmText?: ReactNode;
  dialogHeader?: ReactNode;
  pollInterval?: number;
  task: TaskProgressDialog_TaskFragment;
  refetch: () => Promise<TaskProgressDialog_TaskFragment>;
}
export function TaskProgressDialog({
  confirmText,
  dialogHeader,
  pollInterval,
  task,
  refetch,
  ...props
}: DialogProps<TaskProgressDialogProps, TaskProgressDialog_TaskFragment>) {
  const [processingTask, setProcessingTask] = useState(task);
  useInterval(
    async (done) => {
      try {
        const task = await refetch();
        setProcessingTask(task);
        if (task.status === "COMPLETED") {
          done();
        } else if (task.status === "FAILED") {
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

export function useTaskProgressDialog() {
  return useDialog(TaskProgressDialog);
}
