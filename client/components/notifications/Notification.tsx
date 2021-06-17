import { Avatar } from "@chakra-ui/avatar";
import { Box, Center, Stack, Text } from "@chakra-ui/layout";
import {
  BellIcon,
  CheckIcon,
  CommentIcon,
  EmailXIcon,
  SignatureIcon,
  UserArrowIcon,
  UserGroupArrowIcon,
} from "@parallel/chakra/icons";
import { useMemo } from "react";

function getNotificationIcon(type: string) {
  switch (type) {
    case "COMMENT":
      return (
        <Avatar
          h="36px"
          w="36px"
          bg="gray.200"
          icon={<CommentIcon fontSize="1rem" />}
        />
      );
    case "PETITION-COMPLETED":
      return (
        <Avatar
          h="36px"
          w="36px"
          bg="green.600"
          icon={<CheckIcon color="white" fontSize="1rem" />}
        />
      );

    case "SIGNATURE-COMPLETED":
      return (
        <Avatar
          h="36px"
          w="36px"
          bg="green.500"
          icon={<SignatureIcon color="white" fontSize="1rem" />}
        />
      );
    case "SIGNATURE-CANCELED":
      return (
        <Avatar
          h="36px"
          w="36px"
          bg="red.500"
          icon={<SignatureIcon color="white" fontSize="1rem" />}
        />
      );
    case "PETITION-SHARED":
      return (
        <Avatar
          h="36px"
          w="36px"
          bg="purple.500"
          icon={<UserArrowIcon color="white" fontSize="1rem" />}
        />
      );
    case "PETITION-GROUP-SHARED":
      return (
        <Avatar
          h="36px"
          w="36px"
          bg="purple.500"
          icon={<UserGroupArrowIcon color="white" fontSize="1rem" />}
        />
      );
    case "BOUNCE-EMAIL":
      return (
        <Avatar
          h="36px"
          w="36px"
          bg="red.500"
          icon={<EmailXIcon color="white" fontSize="1rem" />}
        />
      );
    default:
      return (
        <Avatar
          h="36px"
          w="36px"
          bg="blue.400"
          icon={<BellIcon color="white" fontSize="1rem" />}
        />
      );
  }
}

function getNotificationBody(type: string, body: string) {
  return <Text>{body}</Text>;
}

function NotificationTimestamp({ time }: { time: string }) {
  return (
    <Text fontSize="14px" color="gray.500">
      {time}
    </Text>
  );
}

export function Notification({ notification = {} }: { notification: any }) {
  const { type, title, body, timestamp = "", isUnread, meta } = notification;

  const notificationIcon = useMemo(() => getNotificationIcon(type), [type]);

  const notificationBody = useMemo(
    () => getNotificationBody(type, body),
    [type]
  );

  return (
    <Stack
      position="relative"
      direction="row"
      background={isUnread ? "purple.50" : "white"}
      spacing={0}
      paddingY={2}
      paddingX={4}
      borderBottom="1px solid"
      borderColor="gray.200"
    >
      <Center w={"68px"}>
        {isUnread ? (
          <Box
            position="absolute"
            w="8px"
            h="8px"
            background="purple.400"
            borderRadius="50%"
            left="14px"
          ></Box>
        ) : null}
        {notificationIcon}
      </Center>
      <Stack flex={1} spacing={1}>
        <Text fontWeight="600" color="gray.600">
          {title}
        </Text>
        {notificationBody}
        <NotificationTimestamp time={timestamp} />
      </Stack>
    </Stack>
  );
}
