import { gql } from "@apollo/client";
import {
  PetitionUserNotificationFilter,
  useNotifications_UnreadPetitionUserNotificationIdsQuery,
} from "@parallel/graphql/__types";
import {
  useQueryState,
  useQueryStateSlice,
  values,
} from "@parallel/utils/queryState";
import { useEffect } from "react";
import { NotificationsButton } from "./NotificationsButton";
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

export const POLL_INTERVAL = 20000;

export function Notifications() {
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);
  const [filter, setFilter] = useQueryStateSlice(
    queryState,
    setQueryState,
    "notifications"
  );
  const isOpen = filter !== null;

  const { data, startPolling, stopPolling } =
    useNotifications_UnreadPetitionUserNotificationIdsQuery({
      pollInterval: POLL_INTERVAL,
    });

  useEffect(() => {
    if (isOpen) {
      stopPolling();
    } else {
      startPolling(POLL_INTERVAL);
    }
  }, [isOpen]);

  const unreadNotificationIds = data?.me.unreadNotificationIds ?? [];

  return (
    <>
      <NotificationsButton
        onClick={() => setFilter(filter ? null : "ALL")}
        unreadNotificationsCount={unreadNotificationIds.length}
        isOpen={isOpen}
      />
      <NotificationsDrawer value={filter} onChange={setFilter} />
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
