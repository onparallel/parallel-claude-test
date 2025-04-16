import { Box, BoxProps, Placement, TextProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { PaidBadge } from "./PaidBadge";
import { SmallPopover } from "./SmallPopover";
import { SupportLink } from "./SupportLink";

export interface PaidPopoverProps {
  children?: ReactNode;
  contactMessage: string;
  placement?: Placement;
  popoverWidth?: BoxProps["width"];
  fontSize?: TextProps["fontSize"];
}

export const PaidPopover = chakraForwardRef<"svg", PaidPopoverProps>(function (
  { children, placement = "bottom", popoverWidth, fontSize = "sm", contactMessage, ...props },
  ref,
) {
  return (
    <SmallPopover
      content={
        <Box fontSize={fontSize}>
          {children ?? (
            <FormattedMessage
              id="component.paid-popover.content"
              defaultMessage="<a>Contact sales</a> for more information about this feature and pricing."
              values={{
                a: (chunks: any) => <SupportLink message={contactMessage}>{chunks}</SupportLink>,
              }}
            />
          )}
        </Box>
      }
      placement={placement}
      width={popoverWidth}
    >
      <PaidBadge ref={ref} tabIndex="0" cursor="default" {...(props as any)} />
    </SmallPopover>
  );
});
