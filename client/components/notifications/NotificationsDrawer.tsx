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
import { BoxProps, Button } from "@chakra-ui/react";
import { BellIcon, EmailOpenedIcon } from "@parallel/chakra/icons";
import {
  NotificationsDrawer_PetitionUserNotificationFragment,
  PetitionUserNotificationFilter,
  useNotificationsDrawer_PetitionUserNotificationsLazyQuery,
} from "@parallel/graphql/__types";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import {
  useQueryState,
  useQueryStateSlice,
  values,
} from "@parallel/utils/queryState";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { NotificationComment } from "./flavor/NotificationComment";
import { NotificationEmailBounced } from "./flavor/NotificationEmailBounced";
import { NotificationPetitionCompleted } from "./flavor/NotificationPetitionCompleted";
import { NotificationPetitionShared } from "./flavor/NotificationPetitionShared";
import { NotificationsList } from "./NotificationsList";
import { NotificationsSelect } from "./NotificationsSelect";

export interface NotificationsDrawerProps {
  onClose: () => void;
  onPull: () => void;
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

export function NotificationsDrawer({
  onClose,
  onPull,
  isOpen,
}: NotificationsDrawerProps) {
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);
  const [filter, setFilter] = useQueryStateSlice(
    queryState,
    setQueryState,
    "notifications"
  );
  const [hasMore, setHasMore] = useState(false);
  const lastNotificationDate = useRef<string | undefined>(undefined);

  const [getData, { data, loading, refetch, fetchMore }] =
    useNotificationsDrawer_PetitionUserNotificationsLazyQuery({
      notifyOnNetworkStatusChange: true,
    });

  const notifications = getNotificationsFiltered(data?.me.notifications ?? []);
  const hasUnreaded = notifications.filter((n) => !n.isRead).length > 0;
  const prevHasUnreaded = useRef(hasUnreaded);

  useEffect(() => {
    prevHasUnreaded.current = hasUnreaded;
  }, [hasUnreaded]);

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

  useEffect(() => {
    const interval = setInterval(() => {
      if (isOpen) {
        refetch?.({
          limit: NOTIFICATIONS_LIMIT,
          filter,
        });
      }
      onPull();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [isOpen, filter]);

  useEffect(() => {
    console.log("%c --- NotificationsDrawer RENDER ---", "color: #cf132c");
  });

  function getNotificationsFiltered(
    notifications: NotificationsDrawer_PetitionUserNotificationFragment[]
  ) {
    return filter === "UNREAD"
      ? notifications.filter((n) => !n.isRead)
      : notifications;
  }

  const onFetchData = async () => {
    const result = await fetchMore?.({
      variables: {
        limit: NOTIFICATIONS_LIMIT,
        before:
          data?.me.notifications[data?.me.notifications.length - 1]?.createdAt,
        filter,
      },
    });

    const notificationLength = result?.data?.me?.notifications.length ?? 0;
    setHasMore(notificationLength < NOTIFICATIONS_LIMIT ? false : true);
  };

  const handleChangeFilterBy = async (type: PetitionUserNotificationFilter) => {
    setFilter(type);
    lastNotificationDate.current = undefined;

    const result = await refetch?.({
      limit: NOTIFICATIONS_LIMIT,
      filter: type,
    });

    const notificationLength = result?.data?.me?.notifications.length ?? 0;
    setHasMore(notificationLength < NOTIFICATIONS_LIMIT ? false : true);
  };

  const updateIsReadNotification = useUpdateIsReadNotification();
  const handleMarkAllAsRead = async () => {
    await updateIsReadNotification({
      filter: filter,
      isRead: true,
    });
  };

  const MotionFooter = motion<BoxProps>(DrawerFooter);
  const spring = { type: "spring", damping: 20, stiffness: 240 };

  return (
    <Drawer
      placement="right"
      onClose={onClose}
      isOpen={isOpen}
      size="sm"
      isFullHeight
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton top={4} />
        <DrawerHeader
          paddingInlineStart={4}
          paddingInlineEnd={4}
          paddingBottom={2}
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
          <NotificationsSelect
            selectedOption={filter}
            onChange={handleChangeFilterBy}
          />
        </DrawerHeader>
        <DrawerBody
          id="notifications-body"
          paddingInlineStart={0}
          paddingInlineEnd={0}
          paddingY={0}
          paddingBottom={hasUnreaded ? "48px" : "0px"}
          display="flex"
          flexDirection="column"
        >
          <NotificationsList
            hasMore={hasMore}
            onFetchData={onFetchData}
            notifications={notifications}
            loading={loading}
          />
        </DrawerBody>
        <AnimatePresence>
          {hasUnreaded && (
            <MotionFooter
              initial={
                prevHasUnreaded.current
                  ? { transform: "translateY(0px)" }
                  : { transform: "translateY(48px)" }
              }
              animate={{ transform: "translateY(0px)" }}
              exit={{ transform: "translateY(48px)" }}
              transition={spring}
              position="absolute"
              bottom="0px"
              width="100%"
              height="48px"
              justifyContent="center"
              alignItems="center"
              boxShadow="0px -2px 10px 0px #1A202C1A"
              zIndex="1"
              padding="0"
            >
              <Button
                width="100%"
                height="48px"
                borderRadius="2px"
                background="white"
                color="purple.600"
                _hover={{ background: "purple.50" }}
                _active={{ background: "purple.50" }}
                leftIcon={
                  <EmailOpenedIcon fontSize="16px" role="presentation" />
                }
                onClick={handleMarkAllAsRead}
              >
                <Text fontSize="16px" fontWeight="600">
                  <FormattedMessage
                    id="component.notifications-drawer.mark-all-as-read"
                    defaultMessage="Mark all as read"
                  />
                </Text>
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
