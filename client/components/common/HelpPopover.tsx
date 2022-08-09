import { Box, BoxProps, IconProps, Placement, TextProps } from "@chakra-ui/react";
import { QuestionIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { SmallPopover } from "../common/SmallPopover";

export type HelpPopoverProps = {
  children: ReactNode;
  placement?: Placement;
  popoverWidth?: BoxProps["width"];
  fontSize?: TextProps["fontSize"];
} & IconProps;

export const HelpPopover = chakraForwardRef<"svg", HelpPopoverProps>(function (
  { children, placement = "bottom", popoverWidth, fontSize = "sm", ...props },
  ref
) {
  return (
    <SmallPopover
      content={<Box fontSize={fontSize}>{children}</Box>}
      placement={placement}
      width={popoverWidth}
    >
      <QuestionIcon
        ref={ref}
        marginLeft={2}
        color="gray.400"
        _hover={{ color: "gray.500" }}
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
