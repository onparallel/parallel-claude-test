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
  PetitionUserNotificationFilter,
  useNotificationsDrawer_PetitionUserNotificationsQuery,
  useNotificationsDrawer_updatePetitionUserNotificationReadStatusMutation,
} from "@parallel/graphql/__types";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";
import { NotificationComment } from "./flavor/NotificationComment";
import { NotificationDefault } from "./flavor/NotificationDefault";
import { NotificationEmailBounced } from "./flavor/NotificationEmailBounced";
import { NotificationPetitionCompleted } from "./flavor/NotificationPetitionCompleted";
import { NotificationPetitionShared } from "./flavor/NotificationPetitionShared";
import { NotificationsList } from "./NotificationsList";
import { NotificationsSelect } from "./NotificationsSelect";

export interface NotificationsDrawerProps {
  onClose: () => void;
  isOpen: boolean;
}

export function NotificationsDrawer({
  onClose,
  isOpen,
}: NotificationsDrawerProps) {
  const MotionFooter = motion<BoxProps>(DrawerFooter);
  const scrollRef = useRef(null);

  const hasMore = useRef(false);
  const lastNotificationDate = useRef(undefined);
  const selectedFilter = useRef<PetitionUserNotificationFilter>("ALL");

  const { data, refetch } =
    useNotificationsDrawer_PetitionUserNotificationsQuery({
      variables: {
        limit: 50,
        before: lastNotificationDate.current,
        filter: selectedFilter.current,
      },
    });

  const [notifications, setNotifications] = useState(
    data?.me.notifications ?? []
  );

  const hasUnreaded = notifications.filter((n) => !n.isRead).length > 0;

  useEffect(() => {
    if (isOpen) refetch();
  }, [isOpen]);

  useEffect(() => {
    setNotifications(data?.me.notifications ?? []);
  }, [data]);

  const fetchData = () => {
    refetch({
      limit: 50,
      before: lastNotificationDate.current,
      filter: selectedFilter.current,
    });
    console.log("FETCH MORE DATA");
  };

  const handleChangeFilterBy = (type: PetitionUserNotificationFilter) => {
    selectedFilter.current = type;
    refetch({
      limit: 50,
      before: lastNotificationDate.current,
      filter: type,
    });
    console.log("FETCH DATA HERE, TYPE: ", selectedFilter.current);
  };

  const [updateIsReadNotifications] =
    useNotificationsDrawer_updatePetitionUserNotificationReadStatusMutation();

  const handleMarkAllAsRead = async () => {
    const unReaded = await updateIsReadNotifications({
      variables: {
        petitionUserNotificationIds: notifications.map((n) => n.id),
        filter: selectedFilter.current,
        isRead: true,
      },
    });

    console.log("Unreaded: ", unReaded);
  };

  return (
    <Drawer
      placement={"right"}
      onClose={onClose}
      isOpen={isOpen}
      size={"sm"}
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
          <Stack direction={"row"} marginBottom={6} spacing={2} align="center">
            <BellIcon fontSize="20px" role="presentation" />
            <Text>
              <FormattedMessage
                id="component.notifications-drawer.header"
                defaultMessage="Notifications"
              />
            </Text>
          </Stack>
          <NotificationsSelect
            selectedOption={selectedFilter.current}
            onChange={handleChangeFilterBy}
          />
        </DrawerHeader>
        <DrawerBody
          paddingInlineStart={0}
          paddingInlineEnd={0}
          paddingY={0}
          paddingBottom={hasUnreaded ? "48px" : "0px"}
          display="flex"
          flexDirection="column"
          ref={scrollRef}
        >
          <NotificationsList
            hasMore={hasMore.current}
            fetchData={fetchData}
            scrollRef={scrollRef}
            notifications={notifications}
          />
        </DrawerBody>

        <AnimatePresence>
          {hasUnreaded && (
            <MotionFooter
              initial={
                hasUnreaded
                  ? { transform: "translateY(0px)" }
                  : { transform: "translateY(48px)" }
              }
              animate={{ transform: "translateY(0px)" }}
              exit={{ transform: "translateY(48px)" }}
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
      ...NotificationDefault_PetitionUserNotification
      ... on CommentCreatedUserNotification {
        ...NotificationComment_CommentCreatedUserNotification
      }
      ... on MessageEmailBouncedUserNotification {
        ...NotificationEmailBounced_MessageEmailBouncedUserNotification
      }
      ... on PetitionCompletedUserNotification {
        ...NotificationEmailBounced_PetitionCompletedUserNotification
      }
      ... on PetitionSharedUserNotification {
        ...NotificationEmailBounced_PetitionSharedUserNotification
      }
      ... on SignatureCancelledUserNotification {
        ...NotificationDefault_PetitionUserNotification
      }
      ... on SignatureCompletedUserNotification {
        ...NotificationDefault_PetitionUserNotification
      }
    }
    ${NotificationComment.fragments.CommentCreatedUserNotification}
    ${NotificationEmailBounced.fragments.MessageEmailBouncedUserNotification}
    ${NotificationPetitionCompleted.fragments.PetitionCompletedUserNotification}
    ${NotificationPetitionShared.fragments.PetitionSharedUserNotification}
    ${NotificationDefault.fragments.PetitionUserNotification}
  `,
};

NotificationsDrawer.mutations = [
  gql`
    mutation NotificationsDrawer_updatePetitionUserNotificationReadStatus(
      $petitionUserNotificationIds: [GID!]!
      $filter: PetitionUserNotificationFilter
      $isRead: Boolean!
    ) {
      updatePetitionUserNotificationReadStatus(
        petitionUserNotificationIds: $petitionUserNotificationIds
        filter: $filter
        isRead: $isRead
      ) {
        ... on PetitionUserNotification {
          id
          isRead
        }
      }
    }
  `,
];

NotificationsDrawer.queries = [
  gql`
    query NotificationsDrawer_PetitionUserNotifications(
      $limit: Int!
      $before: DateTime
      $filter: PetitionUserNotificationFilter
    ) {
      me {
        notifications(limit: $limit, before: $before, filter: $filter) {
          ...NotificationsDrawer_PetitionUserNotification
        }
      }
    }
    ${NotificationsDrawer.fragments.PetitionUserNotification}
  `,
];
