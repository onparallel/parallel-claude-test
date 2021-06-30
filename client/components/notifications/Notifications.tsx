import { gql } from "@apollo/client";
import {
  PetitionUserNotificationFilter,
  useNotifications_UnreadPetitionUserNotificationIdsQuery,
} from "@parallel/graphql/__types";
import {
  values,
  useQueryState,
  useQueryStateSlice,
} from "@parallel/utils/queryState";
import { useEffect } from "react";
import { NotificationsBell } from "./NotificationsBell";
import { NotificationsDrawer } from "./NotificationsDrawer";

const QUERY_STATE = {
  notifications: values<PetitionUserNotificationFilter>([
    "ALL",
    "COMMENTS",
    "COMPLETED",
    "OTHER",
    "SHARED",
    "UNREAD",
  ]),
};

export function Notifications() {
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);
  const [filter, setFilter] = useQueryStateSlice(
    queryState,
    setQueryState,
    "notifications"
  );

  const handleBellClick = () => {
    filter ? handleClose() : handleOpen();
  };

  const { data, refetch } =
    useNotifications_UnreadPetitionUserNotificationIdsQuery();

  const unreadNotificationIds = data?.me.unreadNotificationIds ?? [];

  const handleClose = () => {
    setFilter(null);
  };

  const handleOpen = () => {
    setFilter("ALL");
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
        isOpen={filter !== null}
      />
      <NotificationsDrawer
        isOpen={filter !== null}
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
