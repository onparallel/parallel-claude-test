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

export interface NotificationListProps {
  notifications: any[];
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
  const getNotificationByType = (notification) => {
    switch (notification.type) {
      case "PETITION_COMPLETED":
        return NotificationPetitionCompleted;
      case "SIGNATURE_COMPLETED":
        return NotificationSignatureCompleted;
      case "SIGNATURE_CANCELLED":
        return NotificationSignatureCanceled;
      case "PETITION_SHARED":
        return NotificationPetitionShared;
      case "MESSAGE_EMAIL_BOUNCED":
        return NotificationEmailBounced;
      case "COMMENT_CREATED":
        return NotificationComment;
      default:
        return NotificationComment;
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
            {notifications.map((notification, index) => {
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
