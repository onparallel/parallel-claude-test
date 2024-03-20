import { gql, useApolloClient, useMutation } from "@apollo/client";
import {
  usePetitionSharingTask_createAddPetitionPermissionTaskDocument,
  usePetitionSharingTask_createAddPetitionPermissionTaskMutationVariables,
  usePetitionSharingTask_createEditPetitionPermissionTaskDocument,
  usePetitionSharingTask_createEditPetitionPermissionTaskMutationVariables,
  usePetitionSharingTask_createRemovePetitionPermissionTaskDocument,
  usePetitionSharingTask_createRemovePetitionPermissionTaskMutationVariables,
  usePetitionSharingTask_taskDocument,
} from "@parallel/graphql/__types";
import { useCallback, useState } from "react";
import { waitFor } from "../promises/waitFor";
import { BackgroundTaskOptions } from "./backgroundTaskOptions";

export function usePetitionSharingBackgroundTask() {
  const apollo = useApolloClient();
  const [createAddPetitionPermissionTask] = useMutation(
    usePetitionSharingTask_createAddPetitionPermissionTaskDocument,
  );
  const [createEditPetitionPermissionTask] = useMutation(
    usePetitionSharingTask_createEditPetitionPermissionTaskDocument,
  );
  const [createRemovePetitionPermissionTask] = useMutation(
    usePetitionSharingTask_createRemovePetitionPermissionTaskDocument,
  );

  const [isLoading, setIsLoading] = useState(false);

  function handleTask<TVariables>(initTask: (variables: TVariables) => Promise<string>) {
    return useCallback(
      async (
        variables: TVariables,
        { signal, timeout = 60_000, pollingInterval = 3_000 }: BackgroundTaskOptions = {},
      ) => {
        setIsLoading(true);
        const taskId = await initTask(variables);

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
            variables: { id: taskId },
            fetchPolicy: "network-only",
          });
          if (task.status === "COMPLETED") {
            setIsLoading(false);
            return task;
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
    addPetitionPermission: handleTask(
      async (
        variables: usePetitionSharingTask_createAddPetitionPermissionTaskMutationVariables,
      ) => {
        const { data: initialData } = await createAddPetitionPermissionTask({ variables });
        return initialData!.createAddPetitionPermissionTask.id;
      },
    ),
    editPetitionPermission: handleTask(
      async (
        variables: usePetitionSharingTask_createEditPetitionPermissionTaskMutationVariables,
      ) => {
        const { data: initialData } = await createEditPetitionPermissionTask({ variables });
        return initialData!.createEditPetitionPermissionTask.id;
      },
    ),
    removePetitionPermission: handleTask(
      async (
        variables: usePetitionSharingTask_createRemovePetitionPermissionTaskMutationVariables,
      ) => {
        const { data: initialData } = await createRemovePetitionPermissionTask({ variables });
        return initialData!.createRemovePetitionPermissionTask.id;
      },
    ),
  };
}

const _mutations = [
  gql`
    mutation usePetitionSharingTask_createAddPetitionPermissionTask(
      $petitionIds: [GID!]
      $folders: FoldersInput
      $permissionType: PetitionPermissionTypeRW!
      $userIds: [GID!]
      $userGroupIds: [GID!]
      $subscribe: Boolean
      $notify: Boolean
      $message: String
    ) {
      createAddPetitionPermissionTask(
        petitionIds: $petitionIds
        folders: $folders
        permissionType: $permissionType
        userIds: $userIds
        userGroupIds: $userGroupIds
        subscribe: $subscribe
        notify: $notify
        message: $message
      ) {
        id
        status
      }
    }
  `,
  gql`
    mutation usePetitionSharingTask_createEditPetitionPermissionTask(
      $petitionIds: [GID!]!
      $permissionType: PetitionPermissionTypeRW!
      $userIds: [GID!]
      $userGroupIds: [GID!]
    ) {
      createEditPetitionPermissionTask(
        petitionIds: $petitionIds
        permissionType: $permissionType
        userIds: $userIds
        userGroupIds: $userGroupIds
      ) {
        id
        status
      }
    }
  `,
  gql`
    mutation usePetitionSharingTask_createRemovePetitionPermissionTask(
      $petitionIds: [GID!]!
      $userIds: [GID!]
      $userGroupIds: [GID!]
      $removeAll: Boolean
    ) {
      createRemovePetitionPermissionTask(
        petitionIds: $petitionIds
        userIds: $userIds
        userGroupIds: $userGroupIds
        removeAll: $removeAll
      ) {
        id
        status
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
