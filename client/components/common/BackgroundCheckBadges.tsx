import { Badge, BadgeProps } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { Text } from "../ui";
import { SmallPopover } from "./SmallPopover";

export function FalsePositivesBadge({ ...props }: BadgeProps) {
  return (
    <Badge colorScheme="green" variant="outline" width="fit-content" {...props}>
      <FormattedMessage
        id="component.background-check-badges.false-positives-text"
        defaultMessage="False positives"
      />
    </Badge>
  );
}

export function PendingResolutionBadge({ ...props }: BadgeProps) {
  return (
    <SmallPopover
      content={
        <Text fontSize="sm">
          <FormattedMessage
            id="component.background-check-badges.pending-resolution-popover"
            defaultMessage="Save a match if there is one, or indicate that all results are false positives to mark this field as resolved."
          />
        </Text>
      }
    >
      <Badge colorScheme="blue" width="fit-content" {...props}>
        <FormattedMessage
          id="component.background-check-badges.pending-resolution-text"
          defaultMessage="Pending resolution"
        />
      </Badge>
    </SmallPopover>
  );
}

export function PendingReviewBadge({ ...props }: BadgeProps) {
  return (
    <SmallPopover
      content={
        <Text fontSize="sm">
          <FormattedMessage
            id="component.background-check-badges.pending-review-popover"
            defaultMessage="There are new updates. Please, confirm or discard them."
          />
        </Text>
      }
    >
      <Badge colorScheme="yellow" width="fit-content" {...props}>
        <FormattedMessage
          id="component.background-check-badges.pending-review-text"
          defaultMessage="Alert"
        />
      </Badge>
    </SmallPopover>
  );
}
