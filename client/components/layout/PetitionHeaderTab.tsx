import { Box, BoxProps, Center, ListItem } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { motion } from "framer-motion";
import { ReactNode, Ref } from "react";
import { SmallPopover } from "../common/SmallPopover";

const MotionBox = motion<Omit<BoxProps, "transition">>(Box);

export const PetitionHeaderTab = chakraForwardRef<
  "a",
  {
    isActive?: boolean;
    isDisabled?: boolean;
    popoverContent?: ReactNode;
    rightIcon?: ReactNode;
    children: ReactNode;
  }
>(function (
  { isActive, isDisabled, children, popoverContent, rightIcon, ...props },
  ref: Ref<any>
) {
  const link = (
    <ListItem position="relative" display="flex" alignItems="stretch">
      <Center
        ref={ref}
        as="a"
        paddingX={{ base: 2.5, md: 5 }}
        aria-current={isActive ? "page" : undefined}
        aria-disabled={isDisabled ? true : undefined}
        textTransform="uppercase"
        variant="ghost"
        fontWeight="normal"
        _hover={{ color: "blue.600", backgroundColor: "white" }}
        _activeLink={{ color: "blue.600", WebkitTextStrokeWidth: "0.04em" }}
        _disabled={{ color: "gray.500", cursor: "not-allowed" }}
        {...(props as any)}
      >
        {children}
        {rightIcon ? <Center marginLeft={1}>{rightIcon}</Center> : null}
      </Center>
      {isActive && (
        <MotionBox
          width="100%"
          height="4px"
          position="absolute"
          bottom="-2px"
          backgroundColor="blue.600"
          transition={{ duration: 0.15 }}
          layoutId="petition-header-tab-active-indicator"
        />
      )}
    </ListItem>
  );
  if (isDisabled) {
    return (
      <SmallPopover placement="bottom" content={popoverContent ?? null}>
        {link}
      </SmallPopover>
    );
  } else {
    return link;
  }
});
