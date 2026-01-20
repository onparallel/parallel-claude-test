import { gql } from "@apollo/client";
import { CheckIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionCompletedEvent_PetitionCompletedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserOrContactReference } from "../../../common/UserOrContactReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionCompletedEventProps {
  event: TimelinePetitionCompletedEvent_PetitionCompletedEventFragment;
}

export function TimelinePetitionCompletedEvent({ event }: TimelinePetitionCompletedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={CheckIcon} color="white" backgroundColor="green.500" />}
    >
      <FormattedMessage
        id="component.timeline-petition-completed-event.description"
        defaultMessage="{someone} completed the parallel {timeAgo}"
        values={{
          someone: <UserOrContactReference userOrAccess={event.completedBy} />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

const _fragments = {
  PetitionCompletedEvent: gql`
    fragment TimelinePetitionCompletedEvent_PetitionCompletedEvent on PetitionCompletedEvent {
      completedBy {
        ...UserOrContactReference_UserOrPetitionAccess
      }
      createdAt
    }
  `,
};
