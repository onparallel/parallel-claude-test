import { gql } from "@apollo/client";
import { Box, Button, Flex } from "@chakra-ui/react";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionApprovalRequestStepSkippedEvent_PetitionApprovalRequestStepSkippedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useBuildUrlToPetitionSection } from "@parallel/utils/goToPetition";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionApprovalRequestStepSkippedEventProps {
  event: TimelinePetitionApprovalRequestStepSkippedEvent_PetitionApprovalRequestStepSkippedEventFragment;
}

export function TimelinePetitionApprovalRequestStepSkippedEvent({
  event,
}: TimelinePetitionApprovalRequestStepSkippedEventProps) {
  const approvalStep = event.approvalRequestStep.stepName;
  const buildUrlToSection = useBuildUrlToPetitionSection();

  return (
    <TimelineItem
      icon={<TimelineIcon icon={AlertCircleIcon} color="white" backgroundColor="red.500" />}
    >
      <Flex align="center">
        <Box>
          <FormattedMessage
            id="component.timeline-petition-approval-request-step-skipped-event.description"
            defaultMessage='{user} skipped step "{approvalStep}" {timeAgo}'
            values={{
              user: <UserReference user={event.user} />,
              timeAgo: (
                <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
              ),
              approvalStep,
            }}
          />
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
  PetitionApprovalRequestStepSkippedEvent: gql`
    fragment TimelinePetitionApprovalRequestStepSkippedEvent_PetitionApprovalRequestStepSkippedEvent on PetitionApprovalRequestStepSkippedEvent {
      approvalRequestStep {
        id
        stepName
      }
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
