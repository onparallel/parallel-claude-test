import { gql } from "@apollo/client";
import { Button, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@chakra-ui/react";
import { BaseDialog } from "@parallel/components/common/BaseDialog";
import { DialogProps } from "@parallel/components/common/DialogProvider";
import { ProgressIndicator, ProgressTrack } from "@parallel/components/common/Progress";
import {
  TaskProgressDialog_TaskFragment,
  useTaskProgressDialog_TaskQuery,
} from "@parallel/graphql/__types";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { generateCssStripe } from "../../utils/css";

export function TaskProgressDialog({
  task,
  pollInterval,
  dialogHeader,
  ...props
}: DialogProps<
  { task: TaskProgressDialog_TaskFragment; dialogHeader?: ReactNode; pollInterval?: number },
  any
>) {
  const { data, refetch } = useTaskProgressDialog_TaskQuery({ variables: { id: task.id } });
  const processingTask = data?.task ?? task;

  const interval = setInterval(() => {
    refetch()
      ?.then(({ data: updatedData }) => {
        if (updatedData.task.status === "COMPLETED") {
          clearInterval(interval);
          props.onResolve(updatedData.task.output);
        } else if (updatedData.task.status === "CANCELLED") {
          clearInterval(interval);
          props.onReject("SERVER_ERROR");
        }
      })
      .catch(() => props.onReject("SERVER_ERROR"));
  }, pollInterval || 1000);

  return (
    <BaseDialog {...props} closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalContent>
        <ModalHeader>
          {dialogHeader ?? (
            <FormattedMessage
              id="component.task-progress-dialog.unknown-task.header"
              defaultMessage="Please wait..."
            />
          )}
        </ModalHeader>
        <ModalBody>
          <TaskProgressBar progress={processingTask.progress} />
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="red" onClick={() => props.onReject()}>
            <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
          </Button>
        </ModalFooter>
      </ModalContent>
    </BaseDialog>
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
      name
      output
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
