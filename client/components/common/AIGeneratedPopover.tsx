import { Placement, TextProps } from "@chakra-ui/react";
import { SparklesIcon } from "@parallel/chakra/icons";
import { Box, BoxProps } from "@parallel/components/ui";
import { chakraComponent } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { SmallPopover } from "./SmallPopover";

export interface AIGeneratedPopoverProps {
  children?: ReactNode;
  placement?: Placement;
  popoverWidth?: BoxProps["width"];
  fontSize?: TextProps["fontSize"];
}

export const AIGeneratedPopover = chakraComponent<"svg", AIGeneratedPopoverProps>(
  function AIGeneratedPopover({
    ref,
    children,
    placement = "bottom",
    popoverWidth,
    fontSize = "sm",
    ...props
  }) {
    return (
      <SmallPopover
        content={
          <Box fontSize={fontSize}>
            {children ?? (
              <FormattedMessage
                id="component.ai-generated-popover.default-message"
                defaultMessage="AI-processed information may contain inaccuracies. Make sure to review it before making any decisions."
              />
            )}
          </Box>
        }
        placement={placement}
        width={popoverWidth}
      >
        <SparklesIcon
          ref={ref}
          color="primary.400"
          _hover={{ color: "primary.600", backgroundColor: "gray.200" }}
          _focus={{
            boxShadow: "outline",
            outline: "none",
            borderRadius: "full",
          }}
          borderRadius="full"
          backgroundColor="gray.100"
          padding={1}
          boxSize={6}
          tabIndex="0"
          {...(props as any)}
        />
      </SmallPopover>
    );
  },
);
