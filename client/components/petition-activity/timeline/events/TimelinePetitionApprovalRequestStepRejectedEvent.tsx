import { gql } from "@apollo/client";
import { ThumbsDownIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionApprovalRequestStepRejectedEvent_PetitionApprovalRequestStepRejectedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionApprovalRequestStepRejectedEventProps {
  event: TimelinePetitionApprovalRequestStepRejectedEvent_PetitionApprovalRequestStepRejectedEventFragment;
}

export function TimelinePetitionApprovalRequestStepRejectedEvent({
  event,
}: TimelinePetitionApprovalRequestStepRejectedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={ThumbsDownIcon} color="white" backgroundColor="red.500" />}
    >
      <FormattedMessage
        id="component.timeline-petition-approval-request-step-rejected-event.description"
        defaultMessage="{user} rejected the process {timeAgo}"
        values={{
          user: <UserReference user={event.user} />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

const _fragments = {
  PetitionApprovalRequestStepRejectedEvent: gql`
    fragment TimelinePetitionApprovalRequestStepRejectedEvent_PetitionApprovalRequestStepRejectedEvent on PetitionApprovalRequestStepRejectedEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
  `,
};
