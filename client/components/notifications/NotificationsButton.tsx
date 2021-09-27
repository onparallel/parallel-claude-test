import { gql, useQuery } from "@apollo/client";
import { Box, BoxProps, Circle } from "@chakra-ui/react";
import { BellIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Notifications_UnreadPetitionUserNotificationIdsQuery } from "@parallel/graphql/__types";
import { useNotificationsState } from "@parallel/utils/useNotificationsState";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";

const MotionBox = motion<Omit<BoxProps, "transition">>(Box);

const POLL_INTERVAL = 20000;

export const NotificationsButton = chakraForwardRef<"button", {}>(function NotificationsBell(
  props,
  ref
) {
  const intl = useIntl();
  const { data, startPolling, stopPolling } =
    useQuery<Notifications_UnreadPetitionUserNotificationIdsQuery>(
      gql`
        query Notifications_UnreadPetitionUserNotificationIds {
          me {
            id
            unreadNotificationIds
          }
        }
      `,
      { pollInterval: POLL_INTERVAL }
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

  const unreadCount = data?.me.unreadNotificationIds.length ?? 0;

  const bellAnimation = {
    rotate: [0, 5, -5, 4, -4, 2, -2, 1, 0].map((x) => x * 3),
  };

  return (
    <IconButtonWithTooltip
      ref={ref}
      aria-pressed={isOpen}
      label={intl.formatMessage(
        {
          id: "component.notifications-button.notifications",
          defaultMessage: "Notifications{count, plural, =0 {} other {, # unread}}",
        },
        { count: unreadCount }
      )}
      placement="right"
      position="relative"
      size="md"
      variant={isOpen ? "solid" : "ghost"}
      backgroundColor="white"
      isRound
      onClick={onOpen}
      icon={
        <>
          <motion.div
            whileHover={unreadCount ? bellAnimation : {}}
            whileTap={{ scale: 0.9 }}
            animate={unreadCount ? bellAnimation : {}}
          >
            <BellIcon fontSize="22px" />
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
                boxSize="14px"
                padding="2px"
                right="6px"
                top="6px"
              >
                <Circle boxSize="10px" background="purple.500" />
              </MotionBox>
            ) : null}
          </AnimatePresence>
        </>
      }
      {...props}
    />
  );
});
