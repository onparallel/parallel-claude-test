import { IconButton } from "@chakra-ui/button";
import { Box, BoxProps } from "@chakra-ui/layout";
import { Circle } from "@chakra-ui/react";
import { BellIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useIntl } from "react-intl";

export interface NotificationsButtonProps {
  isOpen: boolean;
  unreadNotificationsCount: number;
}

const MotionBox = motion<Omit<BoxProps, "transition">>(Box);

export const NotificationsButton = chakraForwardRef<
  "button",
  NotificationsButtonProps
>(function NotificationsBell(
  { isOpen, unreadNotificationsCount, ...props },
  ref
) {
  const intl = useIntl();

  const bellAnimation = {
    rotate: [0, 5, -5, 4, -4, 2, -2, 1, 0].map((x) => x * 3),
  };

  return (
    <IconButton
      ref={ref}
      aria-pressed={isOpen}
      aria-label={intl.formatMessage(
        {
          id: "component.notifications-button.notifications",
          defaultMessage:
            "Notifications{count, plural, =0 {} other {, # unread}}",
        },
        { count: unreadNotificationsCount }
      )}
      position="relative"
      size="md"
      variant={isOpen ? "solid" : "ghost"}
      backgroundColor="white"
      isRound
      icon={
        <>
          <motion.div
            whileHover={unreadNotificationsCount ? bellAnimation : {}}
            whileTap={{ scale: 0.9 }}
            animate={unreadNotificationsCount ? bellAnimation : {}}
          >
            <BellIcon fontSize="22px" />
          </motion.div>
          <AnimatePresence>
            {unreadNotificationsCount ? (
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
