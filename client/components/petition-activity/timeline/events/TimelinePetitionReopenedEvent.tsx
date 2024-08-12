import { gql } from "@apollo/client";
import { EditIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionReopenedEvent_PetitionReopenedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionReopenedEventProps {
  event: TimelinePetitionReopenedEvent_PetitionReopenedEventFragment;
}

export function TimelinePetitionReopenedEvent({ event }: TimelinePetitionReopenedEventProps) {
  return (
    <TimelineItem icon={<TimelineIcon icon={EditIcon} color="black" backgroundColor="gray.200" />}>
      <FormattedMessage
        id="component.timeline-petition-reopened-event.description"
        defaultMessage="{user} reopened the parallel {timeAgo}"
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

TimelinePetitionReopenedEvent.fragments = {
  PetitionReopenedEvent: gql`
    fragment TimelinePetitionReopenedEvent_PetitionReopenedEvent on PetitionReopenedEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
    ${UserReference.fragments.User}
  `,
};
