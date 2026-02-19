/** no-recipient */
import { chakraComponent } from "@parallel/chakra/utils";
import { BoxProps, Text } from "@parallel/components/ui";
import { Badge, Placement, TextProps, ThemingProps } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { SmallPopover } from "./SmallPopover";

export interface NumberingBadgeProps extends ThemingProps<"Badge"> {
  placement?: Placement;
  popoverWidth?: BoxProps["width"];
  fontSize?: TextProps["fontSize"];
}

export const NumberingBadge = chakraComponent<"span", NumberingBadgeProps>(function NumberingBadge({
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
            id="component.numbering-badge.popover"
            defaultMessage="This field will be automatically numbered."
          />
        </Text>
      }
      placement={placement}
      width={popoverWidth}
    >
      <Badge ref={ref} fontStyle="normal" colorScheme="blue" cursor="default" {...props}>
        <FormattedMessage id="component.numbering-badge.text" defaultMessage="Num" />
      </Badge>
    </SmallPopover>
  );
});
