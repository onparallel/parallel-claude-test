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
  Notifications_PetitionUserNotificationFragment,
  PetitionUserNotificationFilter,
} from "@parallel/graphql/__types";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";
import { NotificationsList } from "./NotificationsList";
import { NotificationsSelect } from "./NotificationsSelect";

export interface NotificationsDrawerProps {
  onClose: () => void;
  isOpen: boolean;
  notifications: Notifications_PetitionUserNotificationFragment[];
  fetchData: () => void;
  onChangeFilterBy: (arg0: PetitionUserNotificationFilter) => void;
  selectedFilter: PetitionUserNotificationFilter;
  hasMore: boolean;
  onMarkAllAsRead: () => void;
}

export function NotificationsDrawer({
  onClose,
  isOpen,
  notifications,
  fetchData,
  onChangeFilterBy,
  selectedFilter,
  hasMore,
  onMarkAllAsRead,
}: NotificationsDrawerProps) {
  const MotionFooter = motion<BoxProps>(DrawerFooter);
  const scrollRef = useRef(null);

  const hasUnreaded = notifications.filter((n) => !n.isRead).length > 0;
  const showFooter = useRef(hasUnreaded);

  useEffect(() => {
    showFooter.current = hasUnreaded;
  }, [notifications]);

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
            selectedOption={selectedFilter}
            onChange={onChangeFilterBy}
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
            hasMore={hasMore}
            fetchData={fetchData}
            scrollRef={scrollRef}
            notifications={notifications}
          />
        </DrawerBody>

        <AnimatePresence>
          {hasUnreaded && (
            <MotionFooter
              initial={
                showFooter.current
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
                onClick={onMarkAllAsRead}
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
