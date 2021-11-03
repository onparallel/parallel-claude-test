import { gql } from "@apollo/client";
import { Button } from "@chakra-ui/react";
import { DialogProps } from "@parallel/components/common/DialogProvider";
import { ProgressIndicator, ProgressTrack } from "@parallel/components/common/Progress";
import {
  TaskProgressDialog_TaskFragment,
  useTaskProgressDialog_TaskQuery,
} from "@parallel/graphql/__types";
import { useInterval } from "@parallel/utils/useInterval";
import { ReactNode, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { generateCssStripe } from "../../utils/css";
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
  const { data, refetch } = useTaskProgressDialog_TaskQuery({ variables: { id: task.id } });
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
      body={<TaskProgressBar progress={processingTask.progress} />}
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

function TaskProgressBar({ progress }: { progress?: number | null }) {
  return (
    <ProgressTrack min={0} max={100} size="md" value={progress ?? 100} backgroundColor="gray.200">
      <ProgressIndicator
        min={0}
        max={100}
        value={progress ?? 100}
        backgroundColor="green.400"
        sx={
          progress
            ? undefined
            : generateCssStripe({ color: "gray.200", size: "1rem", isAnimated: true })
        }
      />
    </ProgressTrack>
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
