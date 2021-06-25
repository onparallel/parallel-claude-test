import { gql } from "@apollo/client";
import { useDisclosure } from "@chakra-ui/hooks";
import {
  Notifications_PetitionUserNotificationFragment,
  PetitionUserNotificationFilter,
  useNotifications_updatePetitionUserNotificationReadStatusMutation,
} from "@parallel/graphql/__types";
import { useRef } from "react";
import { useEffect, useState } from "react";
import { NotificationComment } from "./flavor/NotificationComment";
import { NotificationDefault } from "./flavor/NotificationDefault";
import { NotificationEmailBounced } from "./flavor/NotificationEmailBounced";
import { NotificationPetitionCompleted } from "./flavor/NotificationPetitionCompleted";
import { NotificationPetitionShared } from "./flavor/NotificationPetitionShared";
import { notificationsMock, unreadedNotificationsMock } from "./mocks";
import { NotificationsBell } from "./NotificationsBell";
import { NotificationsDrawer } from "./NotificationsDrawer";

export function Notifications() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [unreadNotificationIds, setUnreadNotificationIds] = useState(
    unreadedNotificationsMock
  );
  const [notifications, setNotifications] =
    useState<Notifications_PetitionUserNotificationFragment[]>(
      notificationsMock
    );

  const [hasMore, setHasMore] = useState(false);

  const selectedFilter = useRef<PetitionUserNotificationFilter>("ALL");

  const handleBellClick = () => {
    isOpen ? handleClose() : handleOpen();
  };

  const handleClose = () => {
    onClose();
  };

  const handleOpen = () => {
    onOpen();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // setUnreadNotificationIds((un) => {
      //   if (un.length) {
      //     return [];
      //   } else {
      //     return unreadedNotificationsMock;
      //   }
      // });

      console.log("REFETCH HERE");
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchData = () => {
    // if (notifications.length > 30) {
    //   if (hasMore) setHasMore(false);
    //   return;
    // }
    // setTimeout(() => {
    //   setNotifications((n) => [
    //     ...n,
    //     ...n.map((v, index) => {
    //       const a = { ...v };
    //       a.id = n.length + index + 1 + "";
    //       return a;
    //     }),
    //   ]);
    // }, 2000);

    console.log("FETCH DATA HERE");
  };

  const handleChangeFilterBy = (type: PetitionUserNotificationFilter) => {
    selectedFilter.current = type;
    // setNotifications(() =>
    //   notificationsMock.filter((v) => {
    //     switch (type) {
    //       case "ALL":
    //         return true;
    //       case "UNREAD":
    //         return !v.isRead;
    //       case "COMMENTS":
    //         return v.__typename === "CommentCreatedUserNotification";
    //       case "COMPLETED":
    //         return v.__typename === "PetitionCompletedUserNotification";
    //       case "SHARED":
    //         return v.__typename === "PetitionSharedUserNotification";
    //       case "OTHER":
    //         return [
    //           "SignatureCancelledUserNotification",
    //           "SignatureCompletedUserNotification",
    //           "MessageEmailBouncedUserNotification",
    //         ].includes(v.__typename!);
    //       default:
    //         break;
    //     }
    //   })
    // );

    console.log("FETCH DATA HERE, TYPE: ", selectedFilter.current);
  };

  const [updateIsReadNotifications] =
    useNotifications_updatePetitionUserNotificationReadStatusMutation();

  const handleMarkAllAsRead = async () => {
    const unReaded = await updateIsReadNotifications({
      variables: {
        petitionUserNotificationIds: notifications.map((n) => n.id),
        filter: selectedFilter.current,
        isRead: true,
      },
    });

    console.log("Unreaded: ", unReaded);

    // setNotifications((n) =>
    //   n.map((v) => {
    //     v.isRead = true;
    //     return v;
    //   })
    // );
  };

  return (
    <>
      <NotificationsBell
        onClick={handleBellClick}
        hasNotifications={unreadNotificationIds.length > 0}
        isOpen={isOpen}
      />
      <NotificationsDrawer
        fetchData={fetchData}
        notifications={notifications}
        isOpen={isOpen}
        onClose={handleClose}
        hasMore={hasMore}
        selectedFilter={selectedFilter.current}
        onChangeFilterBy={handleChangeFilterBy}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </>
  );
}

Notifications.fragments = {
  PetitionUserNotification: gql`
    fragment Notifications_PetitionUserNotificationPagination on PetitionUserNotificationPagination {
      items {
        ...Notifications_PetitionUserNotification
      }
      totalCount
    }
    fragment Notifications_PetitionUserNotification on PetitionUserNotification {
      ...NotificationDefault_PetitionUserNotification
      ... on CommentCreatedUserNotification {
        ...NotificationComment_CommentCreatedUserNotification
      }
      ... on MessageEmailBouncedUserNotification {
        ...NotificationEmailBounced_MessageEmailBouncedUserNotification
      }
      ... on PetitionCompletedUserNotification {
        ...NotificationEmailBounced_PetitionCompletedUserNotification
      }
      ... on PetitionSharedUserNotification {
        ...NotificationEmailBounced_PetitionSharedUserNotification
      }
      ... on SignatureCancelledUserNotification {
        ...NotificationDefault_PetitionUserNotification
      }
      ... on SignatureCompletedUserNotification {
        ...NotificationDefault_PetitionUserNotification
      }
    }
    ${NotificationComment.fragments.CommentCreatedUserNotification}
    ${NotificationEmailBounced.fragments.MessageEmailBouncedUserNotification}
    ${NotificationPetitionCompleted.fragments.PetitionCompletedUserNotification}
    ${NotificationPetitionShared.fragments.PetitionSharedUserNotification}
    ${NotificationDefault.fragments.PetitionUserNotification}
  `,
};

Notifications.mutations = [
  gql`
    mutation Notifications_updatePetitionUserNotificationReadStatus(
      $petitionUserNotificationIds: [GID!]!
      $filter: PetitionUserNotificationFilter
      $isRead: Boolean!
    ) {
      updatePetitionUserNotificationReadStatus(
        petitionUserNotificationIds: $petitionUserNotificationIds
        filter: $filter
        isRead: $isRead
      ) {
        ... on PetitionUserNotification {
          id
          isRead
        }
      }
    }
  `,
];

Notifications.queries = [
  gql`
    query Notifications_PetitionUserNotifications(
      $offset: Int!
      $limit: Int!
      $filter: PetitionUserNotificationFilter
    ) {
      me {
        notifications(offset: $offset, limit: $limit, filter: $filter) {
          ...Notifications_PetitionUserNotificationPagination
        }
      }
    }
    ${Notifications.fragments.PetitionUserNotification}
  `,
];
