import { gql, useMutation } from "@apollo/client";
import {
  useUpdateIsReadNotificationMutation,
  useUpdateIsReadNotificationMutationVariables,
  useUpdateIsReadNotification_UserFragment,
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

  return useCallback(
    async (variables: useUpdateIsReadNotificationMutationVariables) => {
      await updateIsReadNotification({
        variables,
        update(cache, { data }) {
          const notificationIds =
            data!.updatePetitionUserNotificationReadStatus.map(
              (notification) => notification.id
            );

          updateFragment<useUpdateIsReadNotification_UserFragment>(cache, {
            fragment: useUpdateIsReadNotification.fragments.User,
            id: getMyId(cache),
            data: (user) => ({
              ...user!,
              unreadNotificationIds: variables.isRead
                ? difference(user!.unreadNotificationIds, notificationIds)
                : uniq([...user!.unreadNotificationIds, ...notificationIds]),
            }),
          });
        },
      });
    },
    []
  );
}

useUpdateIsReadNotification.fragments = {
  User: gql`
    fragment useUpdateIsReadNotification_User on User {
      id
      unreadNotificationIds
    }
  `,
};
