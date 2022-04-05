import { gql } from "@apollo/client";
import { CheckIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionCompletedEvent_PetitionCompletedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserOrContactReference } from "../UserOrContactReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelinePetitionCompletedEventProps = {
  event: TimelinePetitionCompletedEvent_PetitionCompletedEventFragment;
  userId: string;
};

export function TimelinePetitionCompletedEvent({
  event,
  userId,
}: TimelinePetitionCompletedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<CheckIcon />} color="white" backgroundColor="green.500" />}
    >
      <FormattedMessage
        id="timeline.petition-completed-description"
        defaultMessage="{userIsYou, select, true {You} other {{name}}} completed the petition {timeAgo}"
        values={{
          userIsYou: event.completedBy?.__typename === "User" && event.completedBy.id === userId,
          name: <UserOrContactReference userOrAccess={event.completedBy} />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelinePetitionCompletedEvent.fragments = {
  PetitionCompletedEvent: gql`
    fragment TimelinePetitionCompletedEvent_PetitionCompletedEvent on PetitionCompletedEvent {
      completedBy {
        ...UserOrContactReference_UserOrPetitionAccess
      }
      createdAt
    }
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
  `,
};
