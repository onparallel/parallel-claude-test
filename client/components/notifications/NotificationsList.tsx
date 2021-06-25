import { Text, Stack } from "@chakra-ui/layout";
import { Box, Center, LinkBox, Spinner } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import InfiniteScroll from "react-infinite-scroll-component";
import { EmptyNotificationsIcon } from "./icons/EmptyNotificationsIcon";
import { NotificationComment } from "./flavor/NotificationComment";
import { NotificationEmailBounced } from "./flavor/NotificationEmailBounced";
import { NotificationPetitionCompleted } from "./flavor/NotificationPetitionCompleted";
import { NotificationPetitionShared } from "./flavor/NotificationPetitionShared";
import { NotificationSignatureCanceled } from "./flavor/NotificationSignatureCanceled";
import { NotificationSignatureCompleted } from "./flavor/NotificationSignatureCompleted";
import { useEffect, useState } from "react";
import { NotificationDefault } from "./flavor/NotificationDefault";
import { NotificationsDrawer_PetitionUserNotificationFragment } from "@parallel/graphql/__types";

export interface NotificationListProps {
  notifications: NotificationsDrawer_PetitionUserNotificationFragment[];
  scrollRef: any;
  fetchData: () => void;
  hasMore: boolean;
}

export function NotificationsList({
  notifications = [],
  scrollRef,
  fetchData,
  hasMore,
}: NotificationListProps) {
  const getNotificationByType = (
    notification: NotificationsDrawer_PetitionUserNotificationFragment
  ) => {
    switch (notification.__typename) {
      case "PetitionCompletedUserNotification":
        return NotificationPetitionCompleted;
      case "SignatureCompletedUserNotification":
        return NotificationSignatureCompleted;
      case "SignatureCancelledUserNotification":
        return NotificationSignatureCanceled;
      case "PetitionSharedUserNotification":
        return NotificationPetitionShared;
      case "MessageEmailBouncedUserNotification":
        return NotificationEmailBounced;
      case "CommentCreatedUserNotification":
        return NotificationComment;
      default:
        return NotificationDefault;
    }
  };

  const [scroll, setScroll] = useState(null);

  useEffect(() => {
    if (scrollRef?.current) setScroll(scrollRef.current);
  }, [scrollRef]);

  return (
    <Stack flex="1" spacing={0}>
      {notifications && notifications.length && scroll ? (
        <InfiniteScroll
          dataLength={notifications.length} //This is important field to render the next data
          next={fetchData}
          hasMore={hasMore}
          loader={
            <Center height="42px" background="gray.75">
              <Spinner
                thickness="2px"
                speed="0.65s"
                emptyColor="gray.200"
                color="gray.600"
                size="md"
              />
            </Center>
          }
          endMessage={null}
          scrollableTarget={scroll}
        >
          <Box>
            {notifications.map((notification) => {
              const Notification = getNotificationByType(notification);
              return (
                <LinkBox tabIndex={0} key={notification.id}>
                  <Notification {...notification} />
                </LinkBox>
              );
            })}
          </Box>
        </InfiniteScroll>
      ) : (
        <Stack
          height="100%"
          alignItems="center"
          justifyContent="center"
          spacing={10}
        >
          <EmptyNotificationsIcon width={"300px"} height={"200px"} />
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
