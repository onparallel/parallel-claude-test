import { gql } from "@apollo/client";
import { UserArrowIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineOwnershipTransferredEvent_OwnershipTransferredEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineOwnershipTransferredEventProps {
  event: TimelineOwnershipTransferredEvent_OwnershipTransferredEventFragment;
}

export function TimelineOwnershipTransferredEvent({
  event,
}: TimelineOwnershipTransferredEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={UserArrowIcon} color="white" backgroundColor="primary.500" />}
    >
      <FormattedMessage
        id="component.timeline-ownership-transferred-event.description"
        defaultMessage="{user} transferred the ownership of this parallel from {previousOwner} to {owner} {timeAgo}"
        values={{
          previousOwner: <UserReference user={event.previousOwner} />,
          user: <UserReference user={event.user} />,
          owner: <UserReference user={event.owner} />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

const _fragments = {
  OwnershipTransferredEvent: gql`
    fragment TimelineOwnershipTransferredEvent_OwnershipTransferredEvent on OwnershipTransferredEvent {
      user {
        ...UserReference_User
      }
      owner {
        ...UserReference_User
      }
      previousOwner {
        ...UserReference_User
      }
      createdAt
    }
  `,
};
