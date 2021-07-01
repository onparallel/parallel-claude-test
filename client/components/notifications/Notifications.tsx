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

export function Notifications() {
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);
  const [filter, setFilter] = useQueryStateSlice(
    queryState,
    setQueryState,
    "notifications"
  );

  const { data } = useNotifications_UnreadPetitionUserNotificationIdsQuery();

  const unreadNotificationIds = data?.me.unreadNotificationIds ?? [];

  useEffect(() => {
    console.log("%c --- Notifications RENDER ---", "color: #018a11");
  });

  return (
    <>
      <NotificationsButton
        onClick={() => setFilter(filter ? null : "ALL")}
        unreadNotificationsCount={unreadNotificationIds.length}
        isOpen={filter !== null}
      />
      <NotificationsDrawer
        isOpen={filter !== null}
        onClose={() => setFilter(null)}
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
