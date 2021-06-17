import { IconButton, IconButtonProps } from "@chakra-ui/button";
import { Box, BoxProps } from "@chakra-ui/layout";
import { BellIcon } from "@parallel/chakra/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useIntl } from "react-intl";

export interface BellProps extends Omit<IconButtonProps, "aria-label"> {
  badgeColor?: string;
  backgroundColor?: string;
  hoverBackgroundColor?: string;
  activeBackgroundColor?: string;
  onClick: () => void;
  isOpen: boolean;
  hasNotifications: boolean;
}

export function Bell({
  badgeColor = "purple.500",
  backgroundColor = "white",
  hoverBackgroundColor = "gray.75",
  activeBackgroundColor = "gray.100",
  onClick,
  isOpen,
  hasNotifications,
  ...props
}: BellProps) {
  const intl = useIntl();

  const showBadge = useRef(hasNotifications);
  useEffect(() => {
    showBadge.current = hasNotifications;
  }, [showBadge, hasNotifications]);

  const amplifier = 3;
  const animationBell = {
    rotate: [
      0,
      5 * amplifier,
      -5 * amplifier,
      4 * amplifier,
      -4 * amplifier,
      2 * amplifier,
      -2 * amplifier,
      1 * amplifier,
      0,
    ],
  };

  const spring = { type: "spring", damping: 8, stiffness: 160 };

  const MotionBox = motion<BoxProps>(Box);

  return (
    <IconButton
      position="relative"
      aria-label={intl.formatMessage({
        id: "component.app-layout-navbar.notifications",
        defaultMessage: "Notifications",
      })}
      onClick={onClick}
      icon={
        <>
          <motion.div
            whileHover={hasNotifications ? animationBell : {}}
            whileTap={{ scale: 0.9 }}
            animate={hasNotifications ? animationBell : {}}
          >
            <BellIcon fontSize="22px" />
          </motion.div>
          <AnimatePresence>
            {hasNotifications && (
              <MotionBox
                initial={
                  showBadge.current
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0.8, scale: 0.6 }
                }
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: [1, 0, 0, 0, 0], scale: 0.8 }}
                transition={spring}
                pointerEvents="none"
                position="absolute"
                h={"14px"}
                w={"14px"}
                borderWidth={"2px"}
                borderColor={"inherit"}
                borderRadius="50%"
                background={badgeColor}
                right={"6px"}
                top={"6px"}
              ></MotionBox>
            )}
          </AnimatePresence>
        </>
      }
      size="md"
      background={backgroundColor}
      borderColor={backgroundColor}
      borderRadius="50%"
      _hover={{
        background: hoverBackgroundColor,
        borderColor: hoverBackgroundColor,
      }}
      _active={{
        background: activeBackgroundColor,
        borderColor: activeBackgroundColor,
      }}
      {...props}
    />
  );
}
