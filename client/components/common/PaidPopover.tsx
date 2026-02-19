import { chakraComponent } from "@parallel/chakra/utils";
import { Placement, TextProps } from "@chakra-ui/react";
import { Box, BoxProps } from "@parallel/components/ui";
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

export const PaidPopover = chakraComponent<"svg", PaidPopoverProps>(function PaidPopover({
  ref,
  children,
  placement = "bottom",
  popoverWidth,
  fontSize = "sm",
  contactMessage,
  ...props
}) {
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
