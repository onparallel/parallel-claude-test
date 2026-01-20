import { gql } from "@apollo/client";
import { ThumbsUpIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionApprovalRequestStepReminderEvent_PetitionApprovalRequestStepReminderEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionApprovalRequestStepReminderEventProps {
  event: TimelinePetitionApprovalRequestStepReminderEvent_PetitionApprovalRequestStepReminderEventFragment;
}

export function TimelinePetitionApprovalRequestStepReminderEvent({
  event,
}: TimelinePetitionApprovalRequestStepReminderEventProps) {
  return (
    <TimelineItem icon={<TimelineIcon icon={ThumbsUpIcon} backgroundColor="gray.200" />}>
      <FormattedMessage
        id="component.timeline-petition-approval-request-step-reminder-event.description"
        defaultMessage="{user} sent a reminder to pending approvers {timeAgo}"
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
  PetitionApprovalRequestStepReminderEvent: gql`
    fragment TimelinePetitionApprovalRequestStepReminderEvent_PetitionApprovalRequestStepReminderEvent on PetitionApprovalRequestStepReminderEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
  `,
};
