import { gql, useMutation } from "@apollo/client";
import {
  useUpdateIsReadNotificationMutation,
  useUpdateIsReadNotificationMutationVariables,
  useUpdateIsReadNotification_UserFragment,
  useUpdateIsReadNotification_PetitionFieldCommentFragment,
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
          ... on CommentCreatedUserNotification {
            comment {
              id
            }
          }
        }
      }
    `
  );

  return useCallback(async (variables: useUpdateIsReadNotificationMutationVariables) => {
    await updateIsReadNotification({
      variables,
      update(cache, { data }) {
        const notifications = data!.updatePetitionUserNotificationReadStatus;

        const notificationIds = notifications.map((n) => n.id);
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

        for (const notification of notifications) {
          if (notification.__typename === "CommentCreatedUserNotification") {
            updateFragment<useUpdateIsReadNotification_PetitionFieldCommentFragment>(cache, {
              fragment: useUpdateIsReadNotification.fragments.PetitionFieldComment,
              id: notification.comment.id,
              data: (comment) => ({
                ...comment!,
                isUnread: !notification.isRead,
              }),
            });
          }
        }
      },
    });
  }, []);
}

useUpdateIsReadNotification.fragments = {
  User: gql`
    fragment useUpdateIsReadNotification_User on User {
      id
      unreadNotificationIds
    }
  `,
  PetitionFieldComment: gql`
    fragment useUpdateIsReadNotification_PetitionFieldComment on PetitionFieldComment {
      id
      isUnread
    }
  `,
};
