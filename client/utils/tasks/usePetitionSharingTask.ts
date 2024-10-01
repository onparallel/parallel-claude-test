import { gql, useApolloClient, useMutation } from "@apollo/client";
import {
  usePetitionSharingTask_createAddPetitionPermissionMaybeTaskDocument,
  usePetitionSharingTask_createAddPetitionPermissionMaybeTaskMutationVariables,
  usePetitionSharingTask_createEditPetitionPermissionMaybeTaskDocument,
  usePetitionSharingTask_createEditPetitionPermissionMaybeTaskMutationVariables,
  usePetitionSharingTask_createRemovePetitionPermissionMaybeTaskDocument,
  usePetitionSharingTask_createRemovePetitionPermissionMaybeTaskMutationVariables,
  usePetitionSharingTask_MaybeTaskFragment,
  usePetitionSharingTask_taskDocument,
} from "@parallel/graphql/__types";
import { useCallback, useState } from "react";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { waitFor } from "../promises/waitFor";
import { BackgroundTaskOptions } from "./backgroundTaskOptions";

export function usePetitionSharingBackgroundTask() {
  const apollo = useApolloClient();
  const [createAddPetitionPermissionMaybeTask] = useMutation(
    usePetitionSharingTask_createAddPetitionPermissionMaybeTaskDocument,
  );
  const [createEditPetitionPermissionMaybeTask] = useMutation(
    usePetitionSharingTask_createEditPetitionPermissionMaybeTaskDocument,
  );
  const [createRemovePetitionPermissionMaybeTask] = useMutation(
    usePetitionSharingTask_createRemovePetitionPermissionMaybeTaskDocument,
  );

  const [isLoading, setIsLoading] = useState(false);

  function handleMaybeTask<TVariables>(
    initTask: (variables: TVariables) => Promise<usePetitionSharingTask_MaybeTaskFragment>,
  ) {
    return useCallback(
      async (
        variables: TVariables,
        { signal, timeout = 60_000, pollingInterval = 3_000 }: BackgroundTaskOptions = {},
      ) => {
        setIsLoading(true);
        const { status, task: maybeTask } = await initTask(variables);

        if (status === "COMPLETED") {
          setIsLoading(false);
          return;
        }

        assert(isNonNullish(maybeTask), "Expected task to be defined");

        const startTime = performance.now();
        while (true) {
          if (signal?.aborted) {
            setIsLoading(false);
            throw new Error("ABORTED");
          }
          if (performance.now() - startTime > timeout) {
            setIsLoading(false);
            throw new Error("TIMEOUT");
          }
          const {
            data: { task },
          } = await apollo.query({
            query: usePetitionSharingTask_taskDocument,
            variables: { id: maybeTask.id },
            fetchPolicy: "network-only",
          });
          if (task.status === "COMPLETED") {
            setIsLoading(false);
            return;
          } else if (task.status === "FAILED") {
            setIsLoading(false);
            throw new Error("FAILED");
          }

          await waitFor(pollingInterval);
        }
      },
      [],
    );
  }

  return {
    isLoading,
    addPetitionPermission: handleMaybeTask(
      async (
        variables: usePetitionSharingTask_createAddPetitionPermissionMaybeTaskMutationVariables,
      ) => {
        const { data: initialData } = await createAddPetitionPermissionMaybeTask({ variables });
        return initialData!.createAddPetitionPermissionMaybeTask;
      },
    ),
    editPetitionPermission: handleMaybeTask(
      async (
        variables: usePetitionSharingTask_createEditPetitionPermissionMaybeTaskMutationVariables,
      ) => {
        const { data: initialData } = await createEditPetitionPermissionMaybeTask({ variables });
        return initialData!.createEditPetitionPermissionMaybeTask;
      },
    ),
    removePetitionPermission: handleMaybeTask(
      async (
        variables: usePetitionSharingTask_createRemovePetitionPermissionMaybeTaskMutationVariables,
      ) => {
        const { data: initialData } = await createRemovePetitionPermissionMaybeTask({ variables });
        return initialData!.createRemovePetitionPermissionMaybeTask;
      },
    ),
  };
}

const _mutations = [
  gql`
    mutation usePetitionSharingTask_createAddPetitionPermissionMaybeTask(
      $petitionIds: [GID!]
      $folders: FoldersInput
      $permissionType: PetitionPermissionTypeRW!
      $userIds: [GID!]
      $userGroupIds: [GID!]
      $subscribe: Boolean
      $notify: Boolean
      $message: String
    ) {
      createAddPetitionPermissionMaybeTask(
        petitionIds: $petitionIds
        folders: $folders
        permissionType: $permissionType
        userIds: $userIds
        userGroupIds: $userGroupIds
        subscribe: $subscribe
        notify: $notify
        message: $message
      ) {
        status
        task {
          id
          status
        }
      }
    }
  `,
  gql`
    mutation usePetitionSharingTask_createEditPetitionPermissionMaybeTask(
      $petitionIds: [GID!]!
      $permissionType: PetitionPermissionTypeRW!
      $userIds: [GID!]
      $userGroupIds: [GID!]
    ) {
      createEditPetitionPermissionMaybeTask(
        petitionIds: $petitionIds
        permissionType: $permissionType
        userIds: $userIds
        userGroupIds: $userGroupIds
      ) {
        status
        task {
          id
          status
        }
      }
    }
  `,
  gql`
    mutation usePetitionSharingTask_createRemovePetitionPermissionMaybeTask(
      $petitionIds: [GID!]!
      $userIds: [GID!]
      $userGroupIds: [GID!]
      $removeAll: Boolean
    ) {
      createRemovePetitionPermissionMaybeTask(
        petitionIds: $petitionIds
        userIds: $userIds
        userGroupIds: $userGroupIds
        removeAll: $removeAll
      ) {
        status
        task {
          id
          status
        }
      }
    }
  `,
];

const _queries = {
  Task: gql`
    query usePetitionSharingTask_task($id: GID!) {
      task(id: $id) {
        id
        status
      }
    }
  `,
};

const _fragments = [
  gql`
    fragment usePetitionSharingTask_MaybeTask on MaybeTask {
      status
      task {
        id
        status
      }
    }
  `,
];
