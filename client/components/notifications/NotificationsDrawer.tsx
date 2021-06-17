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
import { BellIcon, EmailOpenedIcon } from "@parallel/chakra/icons";
import { FormattedMessage } from "react-intl";
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
  const notifications = [
    {
      id: "1",
      type: "COMMENT",
      title: "Notification 1",
      body: "Body notification",
      timestamp: new Date().getTime(),
      isUnread: true,
      meta: {},
    },
    {
      id: "2",
      type: "PETITION-COMPLETED",
      title: "Notification 2",
      body: "Body notification",
      timestamp: new Date().getTime(),
      isUnread: false,
      meta: {},
    },
    {
      id: "3",
      type: "SIGNATURE-COMPLETED",
      title: "Notification 3",
      body: "Body notification",
      timestamp: new Date().getTime(),
      isUnread: false,
      meta: {},
    },
    {
      id: "4",
      type: "SIGNATURE-CANCELED",
      title: "Notification 4",
      body: "Body notification",
      timestamp: new Date().getTime(),
      isUnread: true,
      meta: {},
    },
    {
      id: "5",
      type: "PETITION-SHARED",
      title: "Notification 5",
      body: "Body notification",
      timestamp: new Date().getTime(),
      isUnread: true,
      meta: {},
    },
    {
      id: "6",
      type: "PETITION-GROUP-SHARED",
      title: "Notification 6",
      body: "Body notification",
      timestamp: new Date().getTime(),
      isUnread: true,
      meta: {},
    },
    {
      id: "7",
      type: "BOUNCE-EMAIL",
      title: "Notification 7",
      body: "Body notification",
      timestamp: new Date().getTime(),
      isUnread: false,
      meta: {},
    },
    // {
    //   id: "8",
    //   type: "OTHER",
    //   title: "Notification 8",
    //   body: "Body notification",
    //   timestamp: new Date().getTime(),
    //   isUnread: true,
    //   meta: {},
    // },
    // {
    //   id: "9",
    //   type: "PETITION-COMPLETED",
    //   title: "Notification 9",
    //   body: "Body notification",
    //   timestamp: new Date().getTime(),
    //   isUnread: false,
    //   meta: {},
    // },
    // {
    //   id: "10",
    //   type: "PETITION-COMPLETED",
    //   title: "Notification 10",
    //   body: "Body notification",
    //   timestamp: new Date().getTime(),
    //   isUnread: true,
    //   meta: {},
    // },
  ] as any[];

  return (
    <Drawer placement={"right"} onClose={onClose} isOpen={isOpen} size={"sm"}>
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
          <NotificationsSelect />
        </DrawerHeader>
        <DrawerBody
          paddingInlineStart={0}
          paddingInlineEnd={0}
          paddingY={0}
          display="flex"
          flexDirection="column"
        >
          <NotificationsList notifications={notifications} />
        </DrawerBody>
        <DrawerFooter
          h="48px"
          justifyContent="center"
          alignItems="center"
          boxShadow="0px -2px 10px 0px #1A202C1A"
          zIndex="1"
        >
          <Stack
            direction={"row"}
            spacing={2}
            align="center"
            color="purple.500"
          >
            <EmailOpenedIcon fontSize="20px" role="presentation" />
            <Text fontSize="16px" fontWeight="600">
              <FormattedMessage
                id="component.notifications-drawer.mark-all-as-read"
                defaultMessage="Mark all as read"
              />
            </Text>
          </Stack>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
