import { gql } from "@apollo/client";

import { Box, Button, Flex } from "@parallel/components/ui";
import { ThumbsUpIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionApprovalRequestStepStartedEvent_PetitionApprovalRequestStepStartedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useBuildUrlToPetitionSection } from "@parallel/utils/goToPetition";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionApprovalRequestStepStartedEventProps {
  event: TimelinePetitionApprovalRequestStepStartedEvent_PetitionApprovalRequestStepStartedEventFragment;
}

export function TimelinePetitionApprovalRequestStepStartedEvent({
  event,
}: TimelinePetitionApprovalRequestStepStartedEventProps) {
  const approvalStep = event.approvalRequestStep.stepName;
  const buildUrlToSection = useBuildUrlToPetitionSection();

  return (
    <TimelineItem icon={<TimelineIcon icon={ThumbsUpIcon} backgroundColor="gray.200" />}>
      <Flex align="center">
        <Box>
          {event.triggeredBy === "USER" ? (
            <FormattedMessage
              id="component.timeline-petition-approval-request-step-started-event.triggered-by-user-description"
              defaultMessage='{user} initiated step "{approvalStep}" in this parallel {timeAgo}'
              values={{
                user: <UserReference user={event.user} />,
                timeAgo: (
                  <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
                approvalStep,
              }}
            />
          ) : (
            <FormattedMessage
              id="component.timeline-petition-approval-request-step-started-event.triggered-by-system-description"
              defaultMessage='Step "{approvalStep}" has been initiated in this parallel {timeAgo}'
              values={{
                timeAgo: (
                  <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
                approvalStep,
              }}
            />
          )}
        </Box>
        {isNonNullish(event.comment?.id) ? (
          <Button
            as="a"
            href={buildUrlToSection("replies", {
              comments: "general",
            })}
            size="sm"
            variant="outline"
            marginStart={2}
            background="white"
          >
            <FormattedMessage
              id="generic.timeline-see-message-button"
              defaultMessage="See message"
            />
          </Button>
        ) : null}
      </Flex>
    </TimelineItem>
  );
}

const _fragments = {
  PetitionApprovalRequestStepStartedEvent: gql`
    fragment TimelinePetitionApprovalRequestStepStartedEvent_PetitionApprovalRequestStepStartedEvent on PetitionApprovalRequestStepStartedEvent {
      approvalRequestStep {
        id
        stepName
      }
      triggeredBy
      comment {
        id
      }
      user {
        ...UserReference_User
      }
      createdAt
    }
  `,
};
