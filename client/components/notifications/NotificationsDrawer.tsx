import { gql } from "@apollo/client";
import { Stack, Text } from "@chakra-ui/layout";
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
} from "@chakra-ui/modal";
import { Button, ModalFooterProps } from "@chakra-ui/react";
import { BellIcon, EmailOpenedIcon } from "@parallel/chakra/icons";
import {
  PetitionUserNotificationFilter,
  useNotificationsDrawer_PetitionUserNotificationsLazyQuery,
} from "@parallel/graphql/__types";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import {
  useQueryState,
  useQueryStateSlice,
  values,
} from "@parallel/utils/queryState";
import { Focusable } from "@parallel/utils/types";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { NotificationsFilterSelect } from "./NotificationsFilterSelect";
import { NotificationsList } from "./NotificationsList";

export interface NotificationsDrawerProps {
  onClose: () => void;
  isOpen: boolean;
}

const NOTIFICATIONS_LIMIT = 16;

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

const MotionFooter = motion<Omit<ModalFooterProps, "transition">>(DrawerFooter);

export function NotificationsDrawer({
  onClose,
  isOpen,
}: NotificationsDrawerProps) {
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);
  const [filter, setFilter] = useQueryStateSlice(
    queryState,
    setQueryState,
    "notifications"
  );
  const [hasMore, setHasMore] = useState(false);
  const ignoreLoading = useRef(false);

  const lastNotificationDate = useRef<string | undefined>(undefined);

  const [getData, { data, loading, refetch, fetchMore, networkStatus }] =
    useNotificationsDrawer_PetitionUserNotificationsLazyQuery({
      notifyOnNetworkStatusChange: true,
    });
  console.log({ loading, networkStatus });

  const notifications = data?.me.notifications ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  useEffect(() => {
    if (isOpen) {
      getData({
        variables: {
          limit: NOTIFICATIONS_LIMIT,
          filter,
        },
      });
    }
  }, [isOpen]);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (isOpen) {
  //       ignoreLoading.current = true;
  //       refetch?.({
  //         limit: NOTIFICATIONS_LIMIT,
  //         filter,
  //       });
  //     }
  //     onPull();
  //   }, 10000);
  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, [isOpen, filter]);

  useEffect(() => {
    console.log("%c --- NotificationsDrawer RENDER ---", "color: #cf132c");
  });

  const onFetchData = async () => {
    ignoreLoading.current = true;
    const result = await fetchMore?.({
      variables: {
        limit: NOTIFICATIONS_LIMIT,
        before:
          data?.me.notifications[data?.me.notifications.length - 1]?.createdAt,
        filter,
      },
    });

    const notificationLength = result?.data?.me?.notifications.length ?? 0;
    setHasMore(notificationLength >= NOTIFICATIONS_LIMIT);
  };

  const handleFilterChange = async (
    type: PetitionUserNotificationFilter | null
  ) => {
    setFilter(type);
    ignoreLoading.current = false;
    lastNotificationDate.current = undefined;

    const result = await refetch?.({
      limit: NOTIFICATIONS_LIMIT,
      filter: type,
    });

    const notificationLength = result?.data?.me?.notifications.length ?? 0;
    setHasMore(notificationLength >= NOTIFICATIONS_LIMIT);
  };

  const updateIsReadNotification = useUpdateIsReadNotification();
  const handleMarkAllAsRead = async () => {
    await updateIsReadNotification({
      filter: filter,
      isRead: true,
    });
  };
  const spring = { type: "spring", damping: 20, stiffness: 240 };

  const selectRef = useRef<Focusable>(null);

  return (
    <Drawer
      placement="right"
      onClose={onClose}
      isOpen={isOpen}
      size="sm"
      isFullHeight
      initialFocusRef={selectRef}
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton top={4} />
        <DrawerHeader
          paddingInlineStart={4}
          paddingInlineEnd={4}
          paddingBottom={2}
          borderBottom="1px solid"
          borderColor="gray.200"
        >
          <Stack direction="row" marginBottom={6} spacing={2} align="center">
            <BellIcon fontSize="20px" role="presentation" />
            <Text>
              <FormattedMessage
                id="component.notifications-drawer.header"
                defaultMessage="Notifications"
              />
            </Text>
          </Stack>
          <NotificationsFilterSelect
            ref={selectRef}
            value={filter}
            onChange={handleFilterChange}
          />
        </DrawerHeader>
        <DrawerBody
          id="notifications-body"
          paddingInlineStart={0}
          paddingInlineEnd={0}
          paddingY={0}
          display="flex"
          flexDirection="column"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
            }
          }}
        >
          <NotificationsList
            hasMore={hasMore}
            onFetchData={onFetchData}
            notifications={notifications}
            loading={ignoreLoading.current ? false : loading}
          />
        </DrawerBody>
        <AnimatePresence>
          {hasUnread && (
            <MotionFooter
              initial={{ transform: "translateY(48px)", height: "0px" }}
              exit={{ transform: "translateY(48px)", height: "0px" }}
              animate={{ transform: "translateY(0px)", height: "48px" }}
              transition={spring}
              height="48px"
              justifyContent="center"
              boxShadow="0px -2px 10px 0px #1A202C1A"
              zIndex="1"
              padding="0"
              backgroundColor="white"
            >
              <Button
                variant="outline"
                colorScheme="purple"
                border="none"
                width="100%"
                height="48px"
                borderRadius={0}
                leftIcon={
                  <EmailOpenedIcon fontSize="16px" role="presentation" />
                }
                onClick={handleMarkAllAsRead}
              >
                <FormattedMessage
                  id="component.notifications-drawer.mark-all-as-read"
                  defaultMessage="Mark all as read"
                />
              </Button>
            </MotionFooter>
          )}
        </AnimatePresence>
      </DrawerContent>
    </Drawer>
  );
}

NotificationsDrawer.fragments = {
  PetitionUserNotification: gql`
    fragment NotificationsDrawer_PetitionUserNotification on PetitionUserNotification {
      ...NotificationsList_PetitionUserNotification
    }
    ${NotificationsList.fragments.PetitionUserNotification}
  `,
};

NotificationsDrawer.queries = [
  gql`
    query NotificationsDrawer_PetitionUserNotifications(
      $limit: Int!
      $before: DateTime
      $filter: PetitionUserNotificationFilter
    ) {
      me {
        id
        notifications(limit: $limit, before: $before, filter: $filter) {
          ...NotificationsDrawer_PetitionUserNotification
        }
      }
    }
    ${NotificationsDrawer.fragments.PetitionUserNotification}
  `,
];
