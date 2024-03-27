import { Badge, BadgeProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { FormattedMessage } from "react-intl";

export const PaidBadge = chakraForwardRef<"span", BadgeProps>(function PaidBadge(props, ref) {
  return (
    <Badge colorScheme="blue" textTransform="uppercase" {...props} ref={ref}>
      <FormattedMessage id="component.paid-badge.text" defaultMessage="Paid" />
    </Badge>
  );
});
