import { Box, BoxProps, Placement, TextProps } from "@chakra-ui/react";
import { AlertCircleFilledIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { SmallPopover } from "./SmallPopover";

export interface AlertPopoverProps {
  children: ReactNode;
  placement?: Placement;
  popoverWidth?: BoxProps["width"];
  fontSize?: TextProps["fontSize"];
}

export const AlertPopover = chakraForwardRef<"svg", AlertPopoverProps>(function (
  { children, placement = "bottom", popoverWidth, fontSize = "sm", ...props },
  ref,
) {
  return (
    <SmallPopover
      content={<Box fontSize={fontSize}>{children}</Box>}
      placement={placement}
      width={popoverWidth}
    >
      <AlertCircleFilledIcon
        ref={ref}
        marginLeft={2}
        color="yellow.500"
        _hover={{ color: "yellow.600" }}
        _focus={{
          boxShadow: "outline",
          outline: "none",
          borderRadius: "full",
        }}
        tabIndex="0"
        {...(props as any)}
      />
    </SmallPopover>
  );
});
