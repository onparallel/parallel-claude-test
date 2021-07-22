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
import { forwardRef, ReactNode, useEffect, useRef } from "react";
import { useIntl } from "react-intl";

export interface PetitionUserNotificationProps {
  isFirst?: boolean;
  icon: ReactNode;
  path: string;
  notification: PetitionUserNotification_PetitionUserNotificationFragment;
  children: ReactNode;
}

export const PetitionUserNotification = Object.assign(
  forwardRef<HTMLElement, PetitionUserNotificationProps>(
    function PetitionUserNotification(
      { isFirst, icon, path, notification, children },
      ref
    ) {
      const { isRead, petition, createdAt } = notification;
      const intl = useIntl();
      const markAsReadText = isRead
        ? intl.formatMessage({
            id: "component.petition-user-notification.mark-as-unread",
            defaultMessage: "Mark as unread",
          })
        : intl.formatMessage({
            id: "component.petition-user-notification.mark-as-read",
            defaultMessage: "Mark as read",
          });

      const updateIsReadNotification = useUpdateIsReadNotification();

      const handleMarkAsReadUnread = async () => {
        await updateIsReadNotification({
          petitionUserNotificationIds: [notification.id],
          isRead: !isRead,
        });
      };

      const linkRef = useRef<HTMLAnchorElement>(null);
      const bodyRef = useRef<HTMLDivElement>(null);
      useEffect(() => {
        const content = bodyRef.current!.innerText.replace(/\n+/g, " - ");
        if (isFirst) {
          linkRef.current!.setAttribute(
            "aria-label",
            `${content} - ${intl.formatMessage({
              id: "component.petition-user-notification.instructions",
              defaultMessage:
                "Use up and down arrows to navigate to other notifications. Use space to toggle read status.",
            })}`
          );
        } else {
          linkRef.current!.setAttribute("aria-label", content);
        }
      }, [intl.locale]);
      return (
        <Stack
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
          <Stack flex="1 1 auto" minWidth="0" spacing={0} ref={bodyRef}>
            <Link
              href={`/${intl.locale}/app/petitions/${petition.id}${path}`}
              passHref
            >
              <LinkOverlay
                ref={linkRef}
                draggable="false"
                tabIndex={isFirst ? 0 : -1}
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
                  as="div"
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
                    (petition.__typename === "Petition"
                      ? intl.formatMessage({
                          id: "generic.untitled-petition",
                          defaultMessage: "Untitled petition",
                        })
                      : intl.formatMessage({
                          id: "generic.untitled-template",
                          defaultMessage: "Untitled template",
                        }))}
                </Text>
              </LinkOverlay>
            </Link>
            <Text noOfLines={3} paddingX={4} paddingBottom={1} paddingTop={0.5}>
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
            boxShadow="md"
            _hover={{
              boxShadow: "lg",
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
