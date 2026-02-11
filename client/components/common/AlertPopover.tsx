import { Box, BoxProps, Placement, TextProps } from "@chakra-ui/react";
import { AlertCircleFilledIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { SmallPopover } from "./SmallPopover";

export interface AlertPopoverProps {
  children: ReactNode;
  placement?: Placement;
  popoverWidth?: BoxProps["width"];
  fontSize?: TextProps["fontSize"];
}

export const AlertPopover = chakraComponent<"svg", AlertPopoverProps>(function AlertPopover({
  ref,
  children,
  placement = "bottom",
  popoverWidth,
  fontSize = "sm",
  ...props
}) {
  return (
    <SmallPopover
      content={<Box fontSize={fontSize}>{children}</Box>}
      placement={placement}
      width={popoverWidth}
    >
      <AlertCircleFilledIcon
        ref={ref}
        marginStart={2}
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
