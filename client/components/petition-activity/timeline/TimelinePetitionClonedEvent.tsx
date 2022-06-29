import { gql } from "@apollo/client";
import { PlusCircleIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionClonedEvent_PetitionClonedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelinePetitionClonedEventProps = {
  userId: string;
  event: TimelinePetitionClonedEvent_PetitionClonedEventFragment;
};

export function TimelinePetitionClonedEvent({ event, userId }: TimelinePetitionClonedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<PlusCircleIcon />} color="white" backgroundColor="primary.500" />}
    >
      <FormattedMessage
        id="timeline.petition-cloned-description"
        defaultMessage="{userIsYou, select, true {You} other {{user}}} cloned this parallel {timeAgo}"
        values={{
          userIsYou: userId === event.user?.id,
          user: <UserReference user={event.user} />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelinePetitionClonedEvent.fragments = {
  PetitionClonedEvent: gql`
    fragment TimelinePetitionClonedEvent_PetitionClonedEvent on PetitionClonedEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
    ${UserReference.fragments.User}
  `,
};
