/** no-recipient */
import { Badge, BoxProps, Placement, TextProps, ThemingProps } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { Text } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";
import { SmallPopover } from "./SmallPopover";

export interface InternalFieldBadgeProps extends ThemingProps<"Badge"> {
  placement?: Placement;
  popoverWidth?: BoxProps["width"];
  fontSize?: TextProps["fontSize"];
}

export const InternalFieldBadge = chakraComponent<"span", InternalFieldBadgeProps>(
  function InternalFieldBadge({
    ref,
    placement = "bottom",
    popoverWidth,
    fontSize = "sm",
    ...props
  }) {
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
        <Badge
          ref={ref}
          fontStyle="normal"
          variant="outline"
          colorScheme="blue"
          cursor="default"
          {...props}
        >
          <FormattedMessage id="component.internal-field-badge.text" defaultMessage="Int" />
        </Badge>
      </SmallPopover>
    );
  },
);
