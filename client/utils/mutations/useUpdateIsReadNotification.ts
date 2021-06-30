import { DataProxy, gql, useMutation } from "@apollo/client";
import {
  updateUnreadNotificationIdsFragment,
  useUpdateIsReadNotificationMutation,
  useUpdateIsReadNotificationMutationVariables,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { difference, uniq } from "remeda";
import { getMyId } from "../apollo/getMyId";
import { updateFragment } from "../apollo/updateFragment";

export function useUpdateIsReadNotification() {
  const [updateIsReadNotification] = useMutation<
    useUpdateIsReadNotificationMutation,
    useUpdateIsReadNotificationMutationVariables
  >(
    gql`
      mutation useUpdateIsReadNotification(
        $petitionUserNotificationIds: [GID!]
        $filter: PetitionUserNotificationFilter
        $petitionIds: [GID!]
        $petitionFieldCommentIds: [GID!]
        $isRead: Boolean!
      ) {
        updatePetitionUserNotificationReadStatus(
          petitionUserNotificationIds: $petitionUserNotificationIds
          filter: $filter
          petitionIds: $petitionIds
          petitionFieldCommentIds: $petitionFieldCommentIds
          isRead: $isRead
        ) {
          id
          isRead
        }
      }
    `
  );

  return useCallback(async (variables) => {
    await updateIsReadNotification({
      variables,
      update(cache, { data }) {
        updateUnreadNotificationIds(cache, (user) => {
          const notificationIds =
            data!.updatePetitionUserNotificationReadStatus.map(
              (notification) => notification.id
            );

          return {
            ...user,
            unreadNotificationIds: variables.isRead
              ? difference(user.unreadNotificationIds, notificationIds)
              : uniq([...user.unreadNotificationIds, ...notificationIds]),
          };
        });
      },
    });
  }, []);
}

function updateUnreadNotificationIds(
  cache: DataProxy,
  updateFn: (
    cached: updateUnreadNotificationIdsFragment
  ) => updateUnreadNotificationIdsFragment
) {
  const id = getMyId(cache);

  return updateFragment<updateUnreadNotificationIdsFragment>(cache, {
    fragment: gql`
      fragment updateUnreadNotificationIds on User {
        id
        unreadNotificationIds
      }
    `,
    id: id,
    data: (user) => updateFn(user!),
  });
}
