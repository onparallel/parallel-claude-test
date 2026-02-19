import { Badge, BadgeProps } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { FormattedMessage } from "react-intl";

export const PaidBadge = chakraComponent<"span", BadgeProps>(function PaidBadge({ ref, ...props }) {
  return (
    <Badge colorScheme="blue" textTransform="uppercase" {...props} ref={ref}>
      <FormattedMessage id="component.paid-badge.text" defaultMessage="Paid" />
    </Badge>
  );
});
