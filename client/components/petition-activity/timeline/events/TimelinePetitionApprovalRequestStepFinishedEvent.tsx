import { gql } from "@apollo/client";
import { ThumbsUpIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionApprovalRequestStepFinishedEvent_PetitionApprovalRequestStepFinishedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionApprovalRequestStepFinishedEventProps {
  event: TimelinePetitionApprovalRequestStepFinishedEvent_PetitionApprovalRequestStepFinishedEventFragment;
}

export function TimelinePetitionApprovalRequestStepFinishedEvent({
  event,
}: TimelinePetitionApprovalRequestStepFinishedEventProps) {
  const approvalStep = event.approvalRequestStep.stepName;
  return (
    <TimelineItem
      icon={<TimelineIcon icon={ThumbsUpIcon} color="white" backgroundColor="gray.500" />}
    >
      <FormattedMessage
        id="component.timeline-petition-approval-request-step-finished-event.description"
        defaultMessage='Completed "{approvalStep}" step {timeAgo}'
        values={{
          approvalStep,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelinePetitionApprovalRequestStepFinishedEvent.fragments = {
  PetitionApprovalRequestStepFinishedEvent: gql`
    fragment TimelinePetitionApprovalRequestStepFinishedEvent_PetitionApprovalRequestStepFinishedEvent on PetitionApprovalRequestStepFinishedEvent {
      approvalRequestStep {
        id
        stepName
      }
      user {
        ...UserReference_User
      }
      createdAt
    }
    ${UserReference.fragments.User}
  `,
};
