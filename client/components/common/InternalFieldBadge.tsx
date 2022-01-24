import { Badge, BadgeProps, BoxProps, Placement, Text, TextProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { FormattedMessage } from "react-intl";
import { SmallPopover } from "./SmallPopover";

export type InternalFieldBadgeProps = {
  placement?: Placement;
  popoverWidth?: BoxProps["width"];
  fontSize?: TextProps["fontSize"];
} & BadgeProps;

export const InternalFieldBadge = chakraForwardRef<"svg", InternalFieldBadgeProps>(function (
  { placement = "bottom", popoverWidth, fontSize = "sm", ...props },
  ref
) {
  return (
    <SmallPopover
      content={
        <Text fontSize={fontSize}>
          <FormattedMessage
            id="component.internal-field-badge.popover"
            defaultMessage="The internal fields will not be visible to the recipient."
          />
        </Text>
      }
      placement={placement}
      width={popoverWidth}
    >
      <Badge fontStyle="normal" variant="outline" colorScheme="blue" {...props}>
        <FormattedMessage id="component.internal-field-badge.text" defaultMessage="INT" />
      </Badge>
    </SmallPopover>
  );
});
