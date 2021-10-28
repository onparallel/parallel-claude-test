import { gql } from "@apollo/client";
import { Button, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@chakra-ui/react";
import { BaseDialog } from "@parallel/components/common/BaseDialog";
import { DialogProps, useDialog } from "@parallel/components/common/DialogProvider";
import { ProgressIndicator, ProgressTrack } from "@parallel/components/common/Progress";
import {
  useTaskRunner_TaskFragment,
  useuseTaskRunner_createTaskMutation,
  useuseTaskRunner_TaskQuery,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { generateCssStripe } from "./css";
import { withError } from "./promises/withError";

type TaskName = "PRINT_PDF" | "EXPORT_REPLIES";
type TaskInput<TName extends TaskName> = {
  PRINT_PDF: { petitionId: string };
  EXPORT_REPLIES: {};
}[TName];
type TaskOutput<TName extends TaskName> = {
  PRINT_PDF: { url: string };
  EXPORT_REPLIES: {};
}[TName];

export function useTaskRunner() {
  const [createTask] = useuseTaskRunner_createTaskMutation();
  const showTaskProgressDialog = useDialog(TaskProgressDialog);

  return async function runTask<TName extends TaskName>(
    name: TName,
    input: TaskInput<TName>,
    pollInterval = 1000
  ) {
    const { data } = await createTask({ variables: { name, input } });
    return await withError<Error, TaskOutput<TName>>(
      showTaskProgressDialog({ task: data!.createTask, pollInterval })
    );
  };
}

function TaskProgressDialog({
  task,
  pollInterval,
  ...props
}: DialogProps<{ task: useTaskRunner_TaskFragment; pollInterval?: number }, any>) {
  const intl = useIntl();

  const { data, refetch } = useuseTaskRunner_TaskQuery({ variables: { id: task.id } });
  const processingTask = data?.task ?? task;

  const interval = setInterval(() => {
    refetch()?.then(({ data: updatedData }) => {
      if (updatedData.task.status === "COMPLETED") {
        clearInterval(interval);
        props.onResolve(updatedData.task.output);
      }
    });
  }, pollInterval || 1000);

  const taskNameHeader = useMemo(() => {
    switch (task.name) {
      case "PRINT_PDF":
        return intl.formatMessage({
          id: "component.task-progress-dialog.print-pdf.header",
          defaultMessage: "Generating PDF file",
        });
      case "EXPORT_REPLIES":
        return intl.formatMessage({
          id: "component.task-progress-dialog.export-replies.header",
          defaultMessage: "Exporting replies",
        });
      default:
        return intl.formatMessage({
          id: "component.task-progress-dialog.unknown-task.header",
          defaultMessage: "Please wait...",
        });
    }
  }, [task.name]);

  return (
    <BaseDialog {...props} closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalContent>
        <ModalHeader>{taskNameHeader}</ModalHeader>
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

useTaskRunner.fragments = {
  Task: gql`
    fragment useTaskRunner_Task on Task {
      id
      name
      output
      status
      progress
    }
  `,
};

useTaskRunner.queries = [
  gql`
    query useTaskRunner_Task($id: GID!) {
      task(id: $id) {
        ...useTaskRunner_Task
      }
    }
    ${useTaskRunner.fragments.Task}
  `,
];

useTaskRunner.mutations = [
  gql`
    mutation useTaskRunner_createTask($name: TaskName!, $input: JSONObject!) {
      createTask(name: $name, input: $input) {
        ...useTaskRunner_Task
      }
    }
    ${useTaskRunner.fragments.Task}
  `,
];
