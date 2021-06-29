import { Stack, Text } from "@chakra-ui/layout";
import { Box, Center, LinkBox, Spinner } from "@chakra-ui/react";
import { NotificationsDrawer_PetitionUserNotificationFragment } from "@parallel/graphql/__types";
import { useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { FormattedMessage } from "react-intl";
import { NotificationComment } from "./flavor/NotificationComment";
import { NotificationDefault } from "./flavor/NotificationDefault";
import { NotificationEmailBounced } from "./flavor/NotificationEmailBounced";
import { NotificationPetitionCompleted } from "./flavor/NotificationPetitionCompleted";
import { NotificationPetitionShared } from "./flavor/NotificationPetitionShared";
import { NotificationSignatureCanceled } from "./flavor/NotificationSignatureCanceled";
import { NotificationSignatureCompleted } from "./flavor/NotificationSignatureCompleted";
import { EmptyNotificationsIcon } from "./icons/EmptyNotificationsIcon";

export interface NotificationListProps {
  notifications: NotificationsDrawer_PetitionUserNotificationFragment[];
  onFetchData: () => void;
  hasMore: boolean;
  loading: boolean;
}

export function NotificationsList({
  notifications = [],
  onFetchData,
  hasMore,
  loading,
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

  useEffect(() => {
    console.log("%c --- NotificationsList RENDER ---", "color: #d49e22");
  });

  if (loading)
    return (
      <Center height="100%">
        <Spinner
          thickness="2px"
          speed="0.65s"
          emptyColor="gray.200"
          color="gray.600"
          size="xl"
        />
      </Center>
    );

  return (
    <Stack flex="1" spacing={0}>
      {notifications && notifications.length ? (
        <InfiniteScroll
          dataLength={notifications.length} //This is important field to render the next data
          next={onFetchData}
          hasMore={hasMore}
          scrollThreshold={0.65}
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
          scrollableTarget="notifications-body"
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
          <EmptyNotificationsIcon width="300px" height="200px" />
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
