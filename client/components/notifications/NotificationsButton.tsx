import { gql, useQuery } from "@apollo/client";
import { Badge, Box, BoxProps } from "@chakra-ui/react";
import { BellIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { NotificationsButton_UnreadPetitionUserNotificationIdsDocument } from "@parallel/graphql/__types";
import { useNotificationsState } from "@parallel/utils/useNotificationsState";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NavBarButton } from "../layout/NavBarButton";

const MotionBox = motion<Omit<BoxProps, "transition">>(Box);

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
      rotate: [0, 5, -5, 4, -4, 2, -2, 1, 0].map((x) => x * 3),
    };

    const icon = (
      <>
        <motion.div
          tabIndex={-1}
          whileHover={unreadCount ? bellAnimation : {}}
          whileTap={{ scale: 0.9 }}
          animate={unreadCount ? bellAnimation : {}}
        >
          <BellIcon boxSize={5} aria-hidden="true" />
        </motion.div>
        <AnimatePresence>
          {unreadCount ? (
            <MotionBox
              initial={{ opacity: 0.8, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: [1, 0, 0, 0, 0], scale: 0.8 }}
              transition={{ type: "spring", damping: 8, stiffness: 160 }}
              borderRadius="full"
              pointerEvents="none"
              position="absolute"
              backgroundColor="inherit"
              boxSize="12px"
              padding="2px"
              insetStart="16px"
              top="-1px"
            >
              <Badge
                background="red.500"
                color="white"
                fontSize="12px"
                borderRadius="full"
                minW="16px"
                minH="16px"
                lineHeight="14px"
                border="2px solid white"
              >
                {unreadCount < 100 ? unreadCount : "99+"}
              </Badge>
            </MotionBox>
          ) : null}
        </AnimatePresence>
      </>
    );

    if (props.extended) {
      return (
        <NavBarButton onClick={onOpen} leftIcon={icon}>
          <FormattedMessage
            id="component.notifications-button.notifications-button"
            defaultMessage="Notifications"
          />
        </NavBarButton>
      );
    }

    return (
      <IconButtonWithTooltip
        ref={ref}
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
        icon={icon}
        {...props}
      />
    );
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
