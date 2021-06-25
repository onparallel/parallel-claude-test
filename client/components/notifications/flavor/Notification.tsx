import { Center, Stack, Text } from "@chakra-ui/layout";
import { Circle } from "@chakra-ui/react";
import { EmailIcon, EmailOpenedIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { FORMATS } from "@parallel/utils/dates";
import { useIntl } from "react-intl";

export function Notification({
  id,
  icon,
  body,
  title,
  timestamp,
  isRead,
}: {
  id: string;
  icon: any;
  body: any;
  title: string;
  timestamp: string;
  isRead: boolean;
}) {
  const intl = useIntl();
  const markAsReadText = isRead
    ? intl.formatMessage({
        id: "component.notification.mark-as-unread",
        defaultMessage: "Mark as unread",
      })
    : intl.formatMessage({
        id: "component.notification.mark-as-read",
        defaultMessage: "Mark as read",
      });

  const handleMarkAsReadUnread = () => {
    console.log(`mark as ${isRead ? "unread" : "read"}`, id);
  };

  return (
    <Stack
      direction="row"
      background={isRead ? "white" : "purple.50"}
      spacing={0}
      paddingY={2}
      paddingX={4}
      _hover={{ background: "gray.75", ".mark-as": { display: "flex" } }}
      _focus={{ background: "gray.75", ".mark-as": { display: "flex" } }}
      borderBottom="1px solid"
      borderColor="gray.200"
    >
      <Center width={"68px"}>
        {isRead ? null : (
          <Circle
            boxSize={2}
            backgroundColor="purple.400"
            left="14px"
            position="absolute"
          />
        )}
        {icon}
      </Center>
      <Stack flex={1} spacing={1} position="relative">
        <Center
          display="none"
          className="mark-as"
          position="absolute"
          height="32px"
          width="32px"
          right="0px"
          top="0px"
          background="white"
          borderRadius="5px"
          boxShadow="0px 0px 8px 0px #4A556826"
        >
          <IconButtonWithTooltip
            icon={isRead ? <EmailIcon /> : <EmailOpenedIcon />}
            fontSize="16px"
            onClick={handleMarkAsReadUnread}
            height="24px"
            minWidth="24px"
            borderRadius="5px"
            background="white"
            _hover={{ background: "gray.100" }}
            _focus={{ background: "gray.100" }}
            aria-label={markAsReadText}
            label={markAsReadText}
          />
        </Center>

        <NotificationTitle title={title} />
        {body}
        <NotificationTimestamp time={timestamp} />
      </Stack>
    </Stack>
  );
}

export function NotificationTitle({ title, ...props }: { title: string }) {
  return (
    <Text
      position="relative"
      isTruncated
      maxWidth="290px"
      fontSize="14px"
      fontWeight="600"
      color="gray.600"
      title={title}
      {...props}
    >
      {title}
    </Text>
  );
}

export function NotificationBody({ body }: { body: any }) {
  return (
    <Text color="black" noOfLines={2}>
      {body}
    </Text>
  );
}

function NotificationTimestamp({ time }: { time: string }) {
  return (
    <Text fontSize="14px" color="gray.500">
      <DateTime
        value={time}
        format={FORMATS.LLL}
        whiteSpace="nowrap"
        useRelativeTime
      />
    </Text>
  );
}
