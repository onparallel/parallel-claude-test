import { gql } from "@apollo/client";
import { Stack, Text } from "@chakra-ui/layout";
import { Circle, Flex, LinkOverlay } from "@chakra-ui/react";
import { EmailIcon, EmailOpenedIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { PetitionUserNotification_PetitionUserNotificationFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import Link from "next/link";
import { forwardRef, ReactNode } from "react";
import { useIntl } from "react-intl";

export interface PetitionUserNotificationProps {
  isFocusable?: boolean;
  icon: ReactNode;
  path: string;
  notification: PetitionUserNotification_PetitionUserNotificationFragment;
  children: ReactNode;
}

export const PetitionUserNotification = Object.assign(
  forwardRef<HTMLElement, PetitionUserNotificationProps>(
    function PetitionUserNotification(
      { isFocusable, icon, path, notification, children },
      ref
    ) {
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
        <Stack
          as="article"
          data-notification-id={notification.id}
          ref={ref as any}
          direction="row"
          background={isRead ? "white" : "purple.50"}
          spacing={0}
          paddingY={2}
          _hover={{
            background: "gray.75",
            ".mark-as": { display: "flex" },
          }}
          borderBottom="1px solid"
          borderColor="gray.200"
        >
          <Flex
            minWidth={16}
            paddingLeft={4}
            alignItems="center"
            justifyContent="flex-end"
          >
            {isRead ? null : (
              <Circle
                boxSize={2}
                backgroundColor="purple.400"
                marginRight={1}
              />
            )}
            {icon}
          </Flex>
          <Stack flex="1 1 auto" minWidth="0" spacing={0}>
            <Link
              href={`/${intl.locale}/app/petitions/${petition.id}${path}`}
              passHref
            >
              <LinkOverlay
                tabIndex={isFocusable ? 0 : -1}
                _focus={{
                  outline: "none",
                  _before: { boxShadow: "inline" },
                  ".mark-as": { display: "flex" },
                }}
                onKeyDown={(e) => {
                  if (e.code === "Space") {
                    handleMarkAsReadUnread();
                    e.preventDefault();
                  }
                }}
              >
                <Text
                  as="header"
                  position="relative"
                  paddingX={4}
                  isTruncated
                  fontSize="sm"
                  minWidth="0"
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
              </LinkOverlay>
            </Link>
            <Text noOfLines={2} paddingX={4} paddingY={1}>
              {children}
            </Text>
            <DateTime
              paddingX={4}
              fontSize="sm"
              color="gray.500"
              value={createdAt}
              format={FORMATS.LLL}
              whiteSpace="nowrap"
              useRelativeTime
            />
          </Stack>
          <IconButtonWithTooltip
            display="none"
            className="mark-as"
            position="absolute"
            right={4}
            top={2}
            tabIndex={-1}
            label={markAsReadText}
            icon={isRead ? <EmailIcon /> : <EmailOpenedIcon />}
            fontSize="16px"
            onClick={(e) => {
              e.preventDefault();
              handleMarkAsReadUnread();
            }}
            size="sm"
            background="white"
            _hover={{
              boxShadow: "md",
            }}
          />
        </Stack>
      );
    }
  ),
  {
    fragments: {
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
    },
  }
);
