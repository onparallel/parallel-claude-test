import { Text, Stack } from "@chakra-ui/layout";
import { FormattedMessage } from "react-intl";

import { EmptyNotificationsIcon } from "./EmptyNotificationsIcon";
import { Notification } from "./Notification";

export interface NotificationListProps {
  notifications: any[];
}

export function NotificationsList({
  notifications = [],
}: NotificationListProps) {
  return (
    <Stack flex="1" spacing={0}>
      {notifications && notifications.length ? (
        notifications.map((n) => <Notification key={n.id} notification={n} />)
      ) : (
        <Stack
          height="100%"
          alignItems="center"
          justifyContent="center"
          spacing={10}
        >
          <EmptyNotificationsIcon w={"300px"} h={"200px"} />
          <Text>
            <FormattedMessage
              id="component.notifications-list.empty-notifications"
              defaultMessage="There's no notifications yet"
            />
          </Text>
        </Stack>
      )}
    </Stack>
  );
}
