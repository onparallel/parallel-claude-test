import { gql } from "@apollo/client";
import { DoubleCheckIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionClosedEvent_PetitionClosedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelinePetitionClosedEventProps = {
  userId: string;
  event: TimelinePetitionClosedEvent_PetitionClosedEventFragment;
};

export function TimelinePetitionClosedEvent({ event, userId }: TimelinePetitionClosedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={DoubleCheckIcon} color="white" backgroundColor="green.500" />}
    >
      <FormattedMessage
        id="timeline.petition-closed-description"
        defaultMessage="{userIsYou, select, true {You} other {{user}}} closed the parallel {timeAgo}"
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
