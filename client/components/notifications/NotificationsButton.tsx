import { gql, useQuery } from "@apollo/client";
import { Center, Circle, Text } from "@chakra-ui/react";
import { BellIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { NotificationsButton_UnreadPetitionUserNotificationIdsDocument } from "@parallel/graphql/__types";
import { useNotificationsState } from "@parallel/utils/useNotificationsState";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NavBarButton } from "../layout/NavBarButton";

const POLL_INTERVAL = 30_000;

export const NotificationsButton = Object.assign(
  chakraForwardRef<"button", { extended?: boolean }>(function NotificationsBell(props, ref) {
    const intl = useIntl();
    const { data, startPolling, stopPolling } = useQuery(
      NotificationsButton_UnreadPetitionUserNotificationIdsDocument,
      { pollInterval: POLL_INTERVAL },
    );
    const { isOpen, onOpen } = useNotificationsState();

    useEffect(() => {
      if (isOpen) {
        stopPolling();
      } else {
        startPolling(POLL_INTERVAL);
      }
      return () => stopPolling();
    }, [isOpen]);

    const unreadCount =
      (data?.me.unreadNotificationIds.length && data?.me.unreadNotificationIds.length > 0
        ? data?.me.unreadNotificationIds.length
        : data?.me.unreadNotificationCount) ?? 0;

    const bellAnimation = {
      rotate: [-6, 5, -4, 3, -2, 1, 0].map((x) => x * 3),
    };

    const icon = (
      <motion.div
        variants={{ animate: unreadCount ? bellAnimation : {} }}
        transition={{ duration: 0.8 }}
      >
        <BellIcon boxSize={5} aria-hidden="true" />
      </motion.div>
    );
    const badge = unreadCount ? (
      <Circle
        as={motion.div}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        position="absolute"
        insetEnd="-9px"
        top="-5px"
        size="18px"
        background="red.500"
        color="white"
        fontSize="2xs"
        border="2px solid white"
      >
        {unreadCount < 100 ? unreadCount : null}
      </Circle>
    ) : null;

    if (props.extended) {
      return (
        <NavBarButton
          as={motion.button}
          animate="animate"
          whileHover="animate"
          onClick={onOpen}
          icon={icon}
          badge={badge}
          aria-label={intl.formatMessage(
            {
              id: "component.notifications-button.notifications",
              defaultMessage: "Notifications{count, plural, =0 {} other {, # unread}}",
            },
            { count: unreadCount },
          )}
        >
          <Text as="span" aria-hidden="true">
            <FormattedMessage
              id="component.notifications-button.notifications-button"
              defaultMessage="Notifications"
            />
          </Text>
        </NavBarButton>
      );
    } else {
      return (
        <IconButtonWithTooltip
          ref={ref}
          as={motion.button}
          animate="animate"
          whileHover="animate"
          aria-pressed={isOpen}
          data-testid="notifications-button"
          data-action="open-notifications"
          label={intl.formatMessage(
            {
              id: "component.notifications-button.notifications",
              defaultMessage: "Notifications{count, plural, =0 {} other {, # unread}}",
            },
            { count: unreadCount },
          )}
          placement="bottom"
          position="relative"
          size="md"
          variant={isOpen ? "solid" : "ghost"}
          backgroundColor="white"
          isRound
          onClick={onOpen}
          icon={
            <Center position="relative">
              {icon}
              {badge}
            </Center>
          }
          {...props}
        />
      );
    }
  }),
  {
    fragments: {
      User: gql`
        fragment NotificationsButton_User on User {
          unreadNotificationIds
          unreadNotificationCount
        }
      `,
    },
  },
);

const _queries = [
  gql`
    query NotificationsButton_UnreadPetitionUserNotificationIds {
      me {
        id
        ...NotificationsButton_User
      }
    }
    ${NotificationsButton.fragments.User}
  `,
];
