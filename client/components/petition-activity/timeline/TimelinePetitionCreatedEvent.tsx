import { gql } from "@apollo/client";
import { ShinyIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionCreatedEvent_PetitionCreatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelinePetitionCreatedEventProps = {
  userId: string;
  event: TimelinePetitionCreatedEvent_PetitionCreatedEventFragment;
};

export function TimelinePetitionCreatedEvent({
  event: { user, createdAt },
  userId,
}: TimelinePetitionCreatedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<ShinyIcon />} color="white" backgroundColor="primary.500" />}
      paddingBottom={0}
    >
      <FormattedMessage
        id="timeline.petition-created-description"
        defaultMessage="{userIsYou, select, true {You} other {{user}}} created this parallel {timeAgo}"
        values={{
          userIsYou: userId === user?.id,
          user: <UserReference user={user} />,
          timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
        }}
      />
    </TimelineItem>
  );
}

TimelinePetitionCreatedEvent.fragments = {
  PetitionCreatedEvent: gql`
    fragment TimelinePetitionCreatedEvent_PetitionCreatedEvent on PetitionCreatedEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
    ${UserReference.fragments.User}
  `,
};
