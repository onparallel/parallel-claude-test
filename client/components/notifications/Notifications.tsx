import { gql } from "@apollo/client";
import { useDisclosure } from "@chakra-ui/hooks";
import { useNotifications_UnreadPetitionUserNotificationIdsQuery } from "@parallel/graphql/__types";
import { useEffect } from "react";
import { NotificationsBell } from "./NotificationsBell";
import { NotificationsDrawer } from "./NotificationsDrawer";

export function Notifications() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleBellClick = () => {
    isOpen ? handleClose() : handleOpen();
  };

  const { data, refetch } =
    useNotifications_UnreadPetitionUserNotificationIdsQuery();

  const unreadNotificationIds = data?.me.unreadNotificationIds ?? [];

  const handleClose = () => {
    onClose();
  };

  const handleOpen = () => {
    onOpen();
  };

  const handleRefetch = () => {
    refetch();
  };

  useEffect(() => {
    console.log("%c --- Notifications RENDER ---", "color: #018a11");
  });

  return (
    <>
      <NotificationsBell
        onClick={handleBellClick}
        hasNotifications={unreadNotificationIds.length > 0}
        isOpen={isOpen}
      />
      <NotificationsDrawer
        isOpen={isOpen}
        onClose={handleClose}
        onPull={handleRefetch}
      />
    </>
  );
}

Notifications.queries = [
  gql`
    query Notifications_UnreadPetitionUserNotificationIds {
      me {
        id
        unreadNotificationIds
      }
    }
  `,
];
