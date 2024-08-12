import { gql } from "@apollo/client";
import { DoubleCheckIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionClosedEvent_PetitionClosedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionClosedEventProps {
  event: TimelinePetitionClosedEvent_PetitionClosedEventFragment;
}

export function TimelinePetitionClosedEvent({ event }: TimelinePetitionClosedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={DoubleCheckIcon} color="white" backgroundColor="green.500" />}
    >
      <FormattedMessage
        id="component.timeline-petition-closed-event.description"
        defaultMessage="{user} closed the parallel {timeAgo}"
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

TimelinePetitionClosedEvent.fragments = {
  PetitionClosedEvent: gql`
    fragment TimelinePetitionClosedEvent_PetitionClosedEvent on PetitionClosedEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
    ${UserReference.fragments.User}
  `,
};
