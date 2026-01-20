import { gql } from "@apollo/client";
import { ThumbsUpIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionApprovalRequestStepApprovedEvent_PetitionApprovalRequestStepApprovedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionApprovalRequestStepApprovedEventProps {
  event: TimelinePetitionApprovalRequestStepApprovedEvent_PetitionApprovalRequestStepApprovedEventFragment;
}

export function TimelinePetitionApprovalRequestStepApprovedEvent({
  event,
}: TimelinePetitionApprovalRequestStepApprovedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={ThumbsUpIcon} color="white" backgroundColor="green.500" />}
    >
      <FormattedMessage
        id="component.timeline-petition-approval-request-step-approved-event.description"
        defaultMessage="{user} approved the process {timeAgo}"
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
  PetitionApprovalRequestStepApprovedEvent: gql`
    fragment TimelinePetitionApprovalRequestStepApprovedEvent_PetitionApprovalRequestStepApprovedEvent on PetitionApprovalRequestStepApprovedEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
  `,
};
