import { gql } from "@apollo/client";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionApprovalRequestStepCanceledEvent_PetitionApprovalRequestStepCanceledEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionApprovalRequestStepCanceledEventProps {
  event: TimelinePetitionApprovalRequestStepCanceledEvent_PetitionApprovalRequestStepCanceledEventFragment;
}

export function TimelinePetitionApprovalRequestStepCanceledEvent({
  event,
}: TimelinePetitionApprovalRequestStepCanceledEventProps) {
  const approvalStep = event.approvalRequestStep.stepName;
  return (
    <TimelineItem
      icon={<TimelineIcon icon={AlertCircleIcon} color="white" backgroundColor="red.500" />}
    >
      <FormattedMessage
        id="component.timeline-petition-approval-request-step-canceled-event.description"
        defaultMessage='{user} canceled step "{approvalStep}" {timeAgo}'
        values={{
          user: <UserReference user={event.user} />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
          approvalStep,
        }}
      />
    </TimelineItem>
  );
}

TimelinePetitionApprovalRequestStepCanceledEvent.fragments = {
  PetitionApprovalRequestStepCanceledEvent: gql`
    fragment TimelinePetitionApprovalRequestStepCanceledEvent_PetitionApprovalRequestStepCanceledEvent on PetitionApprovalRequestStepCanceledEvent {
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
