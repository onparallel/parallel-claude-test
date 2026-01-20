import { gql } from "@apollo/client";
import { PlusCircleIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionClonedEvent_PetitionClonedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionClonedEventProps {
  event: TimelinePetitionClonedEvent_PetitionClonedEventFragment;
}

export function TimelinePetitionClonedEvent({ event }: TimelinePetitionClonedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={PlusCircleIcon} color="white" backgroundColor="primary.500" />}
    >
      <FormattedMessage
        id="component.timeline-petition-cloned-event.description"
        defaultMessage="{user} cloned this parallel {timeAgo}"
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
  PetitionClonedEvent: gql`
    fragment TimelinePetitionClonedEvent_PetitionClonedEvent on PetitionClonedEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
  `,
};
