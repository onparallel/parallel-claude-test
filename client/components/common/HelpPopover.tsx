import { Box, BoxProps, Placement, TextProps } from "@chakra-ui/react";
import { QuestionIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { SmallPopover } from "../common/SmallPopover";

export interface HelpPopoverProps {
  children: ReactNode;
  placement?: Placement;
  popoverWidth?: BoxProps["width"];
  fontSize?: TextProps["fontSize"];
}

export const HelpPopover = chakraComponent<"svg", HelpPopoverProps>(function HelpPopover({
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
      <QuestionIcon
        ref={ref}
        marginStart={2}
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
