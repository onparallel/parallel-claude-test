import { Box, BoxProps, Button } from "@chakra-ui/react";
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
    <Button
      as="a"
      ref={ref}
      textTransform="uppercase"
      isDisabled={isDisabled}
      rightIcon={rightIcon}
      variant="ghost"
      fontWeight="normal"
      // fontWeight={isActive ? "600" : "normal"}
      // textShadow={isActive ? "1px 0px 0px" : "normal"}
      color={isActive ? "blue.600" : undefined}
      _hover={{ color: isDisabled ? undefined : "blue.600" }}
      sx={{ WebkitTextStrokeWidth: isActive ? "0.04em" : undefined }}
      {...(isActive ? { "aria-current": "page" } : {})}
      {...(props as any)}
    >
      {children}
      {isActive && (
        <MotionBox
          width="100%"
          height="3px"
          position="absolute"
          bottom={{ base: "-11px", md: "-13px" }}
          backgroundColor="blue.600"
          layoutId="underline"
        />
      )}
    </Button>
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
