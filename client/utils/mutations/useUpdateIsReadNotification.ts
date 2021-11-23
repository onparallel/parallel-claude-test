import { gql, useMutation } from "@apollo/client";
import { VariablesOf } from "@graphql-typed-document-node/core";
import {
  useUpdateIsReadNotification_PetitionFieldCommentFragmentDoc,
  useUpdateIsReadNotification_updatePetitionUserNotificationReadStatusDocument,
  useUpdateIsReadNotification_UserFragmentDoc,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { difference, uniq } from "remeda";
import { getMyId } from "../apollo/getMyId";
import { updateFragment } from "../apollo/updateFragment";

export function useUpdateIsReadNotification() {
  const [updateIsReadNotification] = useMutation(
    useUpdateIsReadNotification_updatePetitionUserNotificationReadStatusDocument
  );

  return useCallback(
    async (
      variables: VariablesOf<
        typeof useUpdateIsReadNotification_updatePetitionUserNotificationReadStatusDocument
      >
    ) => {
      await updateIsReadNotification({
        variables,
        update(cache, { data }) {
          const notifications = data!.updatePetitionUserNotificationReadStatus;

          const notificationIds = notifications.map((n) => n.id);
          updateFragment(cache, {
            fragment: useUpdateIsReadNotification_UserFragmentDoc,
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
              updateFragment(cache, {
                fragment: useUpdateIsReadNotification_PetitionFieldCommentFragmentDoc,
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
  PetitionFieldComment: gql`
    fragment useUpdateIsReadNotification_PetitionFieldComment on PetitionFieldComment {
      id
      isUnread
    }
  `,
};

useUpdateIsReadNotification.mutations = [
  gql`
    mutation useUpdateIsReadNotification_updatePetitionUserNotificationReadStatus(
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
  `,
];
