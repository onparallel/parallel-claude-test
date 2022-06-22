import { gql, useApolloClient } from "@apollo/client";
import { Button, Progress } from "@chakra-ui/react";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  TaskProgressDialog_publicTaskDocument,
  TaskProgressDialog_taskDocument,
  TaskProgressDialog_TaskFragment,
} from "@parallel/graphql/__types";
import { useAsyncEffect } from "@parallel/utils/useAsyncEffect";
import { useInterval } from "@parallel/utils/useInterval";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { ReactNode, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import { ConfirmDialog } from "./ConfirmDialog";

interface TaskProgressDialogProps {
  keycode?: string;
  confirmText?: ReactNode;
  dialogHeader?: ReactNode;
  initTask: () => Promise<TaskProgressDialog_TaskFragment>;
}
export function TaskProgressDialog({
  keycode,
  confirmText,
  dialogHeader,
  initTask,
  ...props
}: DialogProps<TaskProgressDialogProps, TaskProgressDialog_TaskFragment>) {
  const apollo = useApolloClient();

  const [task, setTask] = useState<null | TaskProgressDialog_TaskFragment>(null);
  const taskRef = useUpdatingRef(task);

  useAsyncEffect(async (isMounted) => {
    try {
      const task = await initTask();
      if (isMounted()) {
        setTask(task);
      }
    } catch {
      props.onReject("SERVER_ERROR");
    }
  }, []);

  useInterval(
    async (done) => {
      const task = taskRef.current;
      if (!isDefined(task)) {
        return;
      }
      try {
        let updatedTask: TaskProgressDialog_TaskFragment;
        if (isDefined(keycode)) {
          const { data } = await apollo.query({
            query: TaskProgressDialog_publicTaskDocument,
            variables: { taskId: task.id, keycode },
            fetchPolicy: "network-only",
          });
          updatedTask = data.publicTask;
        } else {
          const { data } = await apollo.query({
            query: TaskProgressDialog_taskDocument,
            variables: { id: task.id },
            fetchPolicy: "network-only",
          });
          updatedTask = data.task;
        }
        setTask(updatedTask);
        if (updatedTask.status === "COMPLETED") {
          done();
        } else if (updatedTask.status === "FAILED") {
          done();
          props.onReject("SERVER_ERROR");
        }
      } catch {
        done();
        props.onReject("SERVER_ERROR");
      }
    },
    1_500,
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
          hasStripe={task?.status === "PROCESSING"}
          isAnimated={isDefined(task) && (task.progress ?? 0) < 100}
          value={task?.progress ?? 0}
          colorScheme="green"
          borderRadius="full"
          isIndeterminate={!isDefined(task) || task.status === "ENQUEUED"}
        />
      }
      confirm={
        <Button
          ref={confirmRef}
          colorScheme="primary"
          isDisabled={task?.status !== "COMPLETED"}
          onClick={() => props.onResolve(task!)}
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

const _queries = [
  gql`
    query TaskProgressDialog_task($id: GID!) {
      task(id: $id) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
  gql`
    query TaskProgressDialog_publicTask($taskId: GID!, $keycode: ID!) {
      publicTask(taskId: $taskId, keycode: $keycode) {
        ...TaskProgressDialog_Task
      }
    }
    ${TaskProgressDialog.fragments.Task}
  `,
];

export function useTaskProgressDialog() {
  return useDialog(TaskProgressDialog);
}
