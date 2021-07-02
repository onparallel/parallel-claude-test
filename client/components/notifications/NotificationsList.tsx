import { gql } from "@apollo/client";
import { Stack, Text } from "@chakra-ui/layout";
import {
  AbsoluteCenterProps,
  Center,
  Circle,
  Flex,
  LinkBox,
  Spinner,
  SquareProps,
} from "@chakra-ui/react";
import { NotificationsDrawer_PetitionUserNotificationFragment } from "@parallel/graphql/__types";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { AnimatePresence, motion } from "framer-motion";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { FormattedMessage } from "react-intl";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import { CommentCreatedUserNotification } from "./flavor/CommentCreatedUserNotification";
import { MessageEmailBouncedUserNotification } from "./flavor/MessageEmailBouncedUserNotification";
import { PetitionCompletedUserNotification } from "./flavor/PetitionCompletedUserNotification";
import { PetitionSharedUserNotification } from "./flavor/PetitionSharedUserNotification";
import { SignatureCancelledUserNotification } from "./flavor/SignatureCancelledUserNotification";
import { SignatureCompletedUserNotification } from "./flavor/SignatureCompletedUserNotification";
import { EmptyNotificationsIcon } from "./icons/EmptyNotificationsIcon";

export interface NotificationListProps {
  notifications: NotificationsDrawer_PetitionUserNotificationFragment[];
  onFetchMore: () => void;
  onRefresh: () => void;
  hasMore: boolean;
  isLoading: boolean;
  isRefetching: boolean;
}

export function NotificationsList({
  notifications,
  onFetchMore,
  onRefresh,
  hasMore,
  isLoading,
  isRefetching,
}: NotificationListProps) {
  const notificationElementsRefs = useMultipleRefs<HTMLElement>();
  const notificationsRef = useUpdatingRef(notifications);

  const MotionCircle = motion<Omit<SquareProps, "transition">>(Circle);
  const MotionCenter = motion<Omit<AbsoluteCenterProps, "transition">>(Center);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevIsRefreshing = useRef(false);

  useEffect(() => {
    prevIsRefreshing.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    if (isRefreshing) {
      const timeout = setTimeout(() => setIsRefreshing(false), 1000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isRefetching]);

  const handleKeyDown = function (event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
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
        const element = notificationElementsRefs[nextNotification.id].current!;
        // chrome does weird shit without the requestAnimationFrame
        requestAnimationFrame(() => {
          scrollIntoView(element, {
            scrollMode: "if-needed",
            behavior: "smooth",
            block: "nearest",
          });
        });
      }
    }
  };

  const spring = { type: "spring", damping: 20, stiffness: 240 };

  return (
    <Flex
      id="notifications-list"
      flex="1"
      flexDirection="column"
      minHeight={0}
      overflow="auto"
      sx={{ "& > *": { flex: 1, display: "flex", flexDirection: "column" } }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      position="relative"
    >
      <AnimatePresence>
        {isRefreshing ? (
          <MotionCenter
            initial={{ transform: "translateY(0px)", height: "20px" }}
            exit={{ transform: "translateY(-20px)", height: "0px" }}
            animate={{ transform: "translateY(0px)", height: "20px" }}
            transition={spring}
            flex="0"
            height="20px"
            background="gray.75"
            zIndex="1"
          >
            <MotionCircle
              initial={
                prevIsRefreshing.current
                  ? { transform: "translateY(0px)" }
                  : { transform: "translateY(-28px)" }
              }
              exit={{ transform: "translateY(-28px)" }}
              animate={{ transform: "translateY(0px)" }}
              transition={spring}
              size="40px"
              boxShadow="md"
              background="white"
              marginTop={6}
              border="1px solid"
              borderColor="gray.75"
            >
              <Spinner
                thickness="2px"
                speed="0.65s"
                emptyColor="gray.200"
                color="gray.600"
                size="md"
              />
            </MotionCircle>
          </MotionCenter>
        ) : null}
      </AnimatePresence>
      <InfiniteScroll
        dataLength={notifications.length}
        next={onFetchMore}
        hasMore={notifications.length && hasMore ? true : false}
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
        refreshFunction={() => {
          setIsRefreshing(true);
          onRefresh();
        }}
        pullDownToRefresh
        pullDownToRefreshThreshold={50}
        pullDownToRefreshContent={
          <Center background="gray.75">
            <Text as="span">
              <FormattedMessage
                id="component.notifications-list.pull-to-refresh"
                defaultMessage="Pull down to refresh"
              />
            </Text>
          </Center>
        }
        releaseToRefreshContent={
          <Center background="gray.75">
            <Text as="span">
              <FormattedMessage
                id="component.notifications-list.release-to-refresh"
                defaultMessage="Release to refresh"
              />
            </Text>
          </Center>
        }
        scrollableTarget="notifications-list"
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

      {isLoading ? (
        <Center
          height="100%"
          width="100%"
          position="absolute"
          background="whiteAlpha.700"
          zIndex="1"
        >
          <Spinner
            thickness="2px"
            speed="0.65s"
            emptyColor="gray.200"
            color="gray.600"
            size="xl"
          />
        </Center>
      ) : null}
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
