import { gql, NetworkStatus, useApolloClient } from "@apollo/client";
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
import { getMyId } from "@parallel/utils/apollo/getMyId";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { Focusable } from "@parallel/utils/types";
import { useNotificationsState } from "@parallel/utils/useNotificationsState";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { NotificationsFilterSelect } from "./NotificationsFilterSelect";
import { NotificationsList } from "./NotificationsList";

const NOTIFICATIONS_LIMIT = 16;
const POLL_INTERVAL = 10000;

const MotionFooter = motion<Omit<ModalFooterProps, "transition">>(DrawerFooter);

export function NotificationsDrawer() {
  const { isOpen, filter, onFilterChange, onClose } = useNotificationsState();
  const lastNotificationDate = useRef<string | undefined>(undefined);
  const [
    getData,
    { data, called, loading, refetch, fetchMore, networkStatus, startPolling, stopPolling },
  ] = useNotificationsDrawer_PetitionUserNotificationsLazyQuery({
    pollInterval: POLL_INTERVAL,
    notifyOnNetworkStatusChange: true,
  });
  const isInitialLoading = loading && networkStatus !== NetworkStatus.fetchMore;
  const filterRef = useRef<Focusable>(null);

  const notifications = data?.me.notifications?.items ?? [];
  const hasMore = data?.me.notifications?.hasMore ?? true;
  const hasUnread = notifications.some((n) => !n.isRead);

  useEffect(() => {
    if (isOpen) {
      if (called) {
        refetch!();
      } else {
        getData({
          variables: {
            limit: NOTIFICATIONS_LIMIT,
            filter,
          },
        });
      }
      startPolling?.(POLL_INTERVAL);
    } else {
      // force unread to refresh on next open
      client.cache.evict({
        id: getMyId(client),
        fieldName: "notifications",
        args: { filter: "UNREAD" },
      });
      stopPolling?.();
    }
  }, [isOpen]);

  const handleFetchMore = async () => {
    await fetchMore!({
      variables: {
        limit: NOTIFICATIONS_LIMIT,
        before: notifications[notifications.length - 1]?.createdAt,
        filter,
      },
    });
  };

  const client = useApolloClient();
  const handleFilterChange = async (type: PetitionUserNotificationFilter | null) => {
    client.cache.evict({
      id: getMyId(client),
      fieldName: "notifications",
      args: { filter: "UNREAD" },
    });
    onFilterChange(type);
    lastNotificationDate.current = undefined;

    await refetch!({
      limit: NOTIFICATIONS_LIMIT,
      filter: type,
    });
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch!();
    setIsRefreshing(false);
  };

  const updateIsReadNotification = useUpdateIsReadNotification();
  const handleMarkAllAsRead = async () => {
    await updateIsReadNotification({ filter, isRead: true });
  };

  return (
    <Drawer
      placement="right"
      onClose={onClose}
      isOpen={isOpen}
      size="sm"
      isFullHeight
      initialFocusRef={filterRef}
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
          <NotificationsFilterSelect ref={filterRef} value={filter} onChange={handleFilterChange} />
        </DrawerHeader>
        <DrawerBody
          paddingInlineStart={0}
          paddingInlineEnd={0}
          paddingY={0}
          display="flex"
          flexDirection="column"
          overflow="initial"
          minHeight={0}
        >
          <NotificationsList
            hasMore={hasMore}
            onFetchMore={handleFetchMore}
            onRefresh={handleRefresh}
            notifications={notifications}
            isLoading={isInitialLoading && !data}
            isRefreshing={isRefreshing}
          />
        </DrawerBody>
        <AnimatePresence>
          {hasUnread && (
            <MotionFooter
              initial={{ transform: "translateY(48px)", height: "0px" }}
              exit={{ transform: "translateY(48px)", height: "0px" }}
              animate={{ transform: "translateY(0px)", height: "48px" }}
              transition={{ type: "spring", damping: 20, stiffness: 240 }}
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
                leftIcon={<EmailOpenedIcon fontSize="16px" role="presentation" />}
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
        unreadNotificationIds
        notifications(limit: $limit, before: $before, filter: $filter) {
          items {
            ...NotificationsDrawer_PetitionUserNotification
          }
          hasMore
        }
      }
    }
    ${NotificationsDrawer.fragments.PetitionUserNotification}
  `,
];
