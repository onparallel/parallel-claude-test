import { gql } from "@apollo/client";
import { Stack, Text } from "@chakra-ui/layout";
import { Box, Center, Flex, LinkBox, Spinner } from "@chakra-ui/react";
import { NotificationsDrawer_PetitionUserNotificationFragment } from "@parallel/graphql/__types";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { KeyboardEvent, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { FormattedMessage } from "react-intl";
import { CommentCreatedUserNotification } from "./flavor/CommentCreatedUserNotification";
import { MessageEmailBouncedUserNotification } from "./flavor/MessageEmailBouncedUserNotification";
import { PetitionCompletedUserNotification } from "./flavor/PetitionCompletedUserNotification";
import { PetitionSharedUserNotification } from "./flavor/PetitionSharedUserNotification";
import { SignatureCancelledUserNotification } from "./flavor/SignatureCancelledUserNotification";
import { SignatureCompletedUserNotification } from "./flavor/SignatureCompletedUserNotification";
import { EmptyNotificationsIcon } from "./icons/EmptyNotificationsIcon";
import scrollIntoView from "smooth-scroll-into-view-if-needed";

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
  useEffect(() => {
    console.log("%c --- NotificationsList RENDER ---", "color: #d49e22");
  });

  const notificationElementsRefs = useMultipleRefs<HTMLElement>();
  const notificationsRef = useUpdatingRef(notifications);

  const handleKeyDown = function (event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        const parent = (event.target as HTMLElement).closest(
          "[data-notification-id]"
        );
        const notificationId = parent!.getAttribute("data-notification-id");
        const index = notificationsRef.current.findIndex(
          (n) => n.id === notificationId
        );
        if (index === -1) {
          return;
        }
        const nextIndex = index + (event.key === "ArrowDown" ? +1 : -1);
        if (nextIndex < 0 || nextIndex >= notificationsRef.current.length) {
          return;
        }
        const nextNotification = notificationsRef.current[nextIndex];
        notificationElementsRefs[nextNotification.id]
          .current!.querySelector("a")!
          .focus();
        scrollIntoView(notificationElementsRefs[nextNotification.id].current!, {
          behavior: "smooth",
          scrollMode: "if-needed",
          block: "nearest",
        });
      }
    }
  };

  if (loading && !hasMore) {
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
  }
  return (
    <Flex
      flex="1"
      flexDirection="column"
      sx={{ "& > *": { flex: 1, display: "flex", flexDirection: "column" } }}
      onKeyDown={handleKeyDown}
    >
      <InfiniteScroll
        dataLength={notifications.length}
        next={onFetchData}
        hasMore={hasMore}
        scrollThreshold={0.7}
        style={{ flex: 1, display: "flex", flexDirection: "column" }}
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
        endMessage={
          notifications.length === 0 ? (
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
          ) : null
        }
        scrollableTarget="notifications-body"
      >
        {notifications.map((notification, i) => {
          const props = {
            ref: notificationElementsRefs[notification.id],
            isFirst: i === 0,
          };
          return (
            <LinkBox key={notification.id}>
              {notification.__typename ===
              "PetitionCompletedUserNotification" ? (
                <PetitionCompletedUserNotification
                  notification={notification}
                  {...props}
                />
              ) : notification.__typename ===
                "SignatureCompletedUserNotification" ? (
                <SignatureCompletedUserNotification
                  notification={notification}
                  {...props}
                />
              ) : notification.__typename ===
                "SignatureCancelledUserNotification" ? (
                <SignatureCancelledUserNotification
                  notification={notification}
                  {...props}
                />
              ) : notification.__typename ===
                "PetitionSharedUserNotification" ? (
                <PetitionSharedUserNotification
                  notification={notification}
                  {...props}
                />
              ) : notification.__typename ===
                "MessageEmailBouncedUserNotification" ? (
                <MessageEmailBouncedUserNotification
                  notification={notification}
                  {...props}
                />
              ) : notification.__typename ===
                "CommentCreatedUserNotification" ? (
                <CommentCreatedUserNotification
                  notification={notification}
                  {...props}
                />
              ) : null}
            </LinkBox>
          );
        })}
      </InfiniteScroll>
    </Flex>
  );
}

NotificationsList.fragments = {
  PetitionUserNotification: gql`
    fragment NotificationsList_PetitionUserNotification on PetitionUserNotification {
      ... on CommentCreatedUserNotification {
        ...CommentCreatedUserNotification_CommentCreatedUserNotification
      }
      ... on MessageEmailBouncedUserNotification {
        ...MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotification
      }
      ... on PetitionCompletedUserNotification {
        ...PetitionCompletedUserNotification_PetitionCompletedUserNotification
      }
      ... on PetitionSharedUserNotification {
        ...PetitionSharedUserNotification_PetitionSharedUserNotification
      }
      ... on SignatureCancelledUserNotification {
        ...SignatureCancelledUserNotification_SignatureCancelledUserNotification
      }
      ... on SignatureCompletedUserNotification {
        ...SignatureCompletedUserNotification_SignatureCompletedUserNotification
      }
    }
    ${CommentCreatedUserNotification.fragments.CommentCreatedUserNotification}
    ${MessageEmailBouncedUserNotification.fragments
      .MessageEmailBouncedUserNotification}
    ${PetitionCompletedUserNotification.fragments
      .PetitionCompletedUserNotification}
    ${PetitionSharedUserNotification.fragments.PetitionSharedUserNotification}
    ${SignatureCancelledUserNotification.fragments
      .SignatureCancelledUserNotification}
    ${SignatureCompletedUserNotification.fragments
      .SignatureCompletedUserNotification}
  `,
};
