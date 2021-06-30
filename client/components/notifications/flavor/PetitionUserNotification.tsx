import { gql } from "@apollo/client";
import { Center, Stack, Text } from "@chakra-ui/layout";
import { Circle, LinkOverlay } from "@chakra-ui/react";
import { EmailIcon, EmailOpenedIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { PetitionUserNotification_PetitionUserNotificationFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { ReactNode } from "react";
import { useIntl } from "react-intl";

export interface NotificationProps {
  icon: ReactNode;
  path: string;
  notification: PetitionUserNotification_PetitionUserNotificationFragment;
  children: ReactNode;
}

export function PetitionUserNotification({
  icon,
  path,
  notification,
  children,
}: NotificationProps) {
  const { isRead, petition, createdAt } = notification;
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

  const updateIsReadNotification = useUpdateIsReadNotification();

  const handleMarkAsReadUnread = async () => {
    await updateIsReadNotification({
      petitionUserNotificationIds: [notification.id],
      isRead: !isRead,
    });
  };

  return (
    <LinkOverlay
      href={`/${intl.locale}/app/petitions/${petition.id}${path}`}
      _focus={{
        outline: "none",
        ".notification-body": {
          background: "gray.75",
          outline: "none",
        },
        ".mark-as": { display: "flex" },
      }}
      onKeyDown={(e) => {
        if (e.code === "Space") {
          handleMarkAsReadUnread();
          e.preventDefault();
        }
      }}
    >
      <Stack
        className="notification-body"
        direction="row"
        background={isRead ? "white" : "purple.50"}
        spacing={0}
        paddingY={2}
        paddingX={4}
        _hover={{ background: "gray.75", ".mark-as": { display: "flex" } }}
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
          <Text
            position="relative"
            isTruncated
            maxWidth="290px"
            fontSize="14px"
            fontWeight={petition.name ? "bold" : "normal"}
            fontStyle={petition.name ? "normal" : "italic"}
            color="gray.600"
          >
            {petition.name ??
              intl.formatMessage({
                id: "generic.untitled-petition",
                defaultMessage: "Untitled petition",
              })}
          </Text>
          <Text noOfLines={2}>{children}</Text>
          <DateTime
            fontSize="14px"
            color="gray.500"
            value={createdAt}
            format={FORMATS.LLL}
            whiteSpace="nowrap"
            useRelativeTime
          />
        </Stack>
        <Center
          display="none"
          className="mark-as"
          position="absolute"
          height="32px"
          width="32px"
          right={4}
          top={2}
          background="white"
          borderRadius="5px"
          boxShadow="0px 0px 8px 0px #4A556826"
        >
          <IconButtonWithTooltip
            tabIndex={1}
            icon={isRead ? <EmailIcon /> : <EmailOpenedIcon />}
            fontSize="16px"
            onClick={(e) => {
              e.preventDefault();
              handleMarkAsReadUnread();
            }}
            height="24px"
            minWidth="24px"
            borderRadius="5px"
            background="white"
            _hover={{ background: "gray.100" }}
            label={markAsReadText}
          />
        </Center>
      </Stack>
    </LinkOverlay>
  );
}

PetitionUserNotification.fragments = {
  PetitionUserNotification: gql`
    fragment PetitionUserNotification_PetitionUserNotification on PetitionUserNotification {
      id
      petition {
        id
        name
      }
      createdAt
      isRead
    }
  `,
};
