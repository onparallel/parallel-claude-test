import { gql } from "@apollo/client";
import { Link, Text } from "@chakra-ui/core";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionCreatedEvent_PetitionCreatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
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
      icon={
        <TimelineIcon icon="shiny" color="white" backgroundColor="purple.500" />
      }
      paddingTop={0}
    >
      <FormattedMessage
        id="timeline.petition-created-description"
        defaultMessage="{same, select, true {You} other {<b>{user}</b>}} created this petition {timeAgo}"
        values={{
          same: userId === user.id,
          b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
          user: user.fullName,
          timeAgo: (
            <Link>
              <DateTime
                value={createdAt}
                format={FORMATS.LLL}
                useRelativeTime="always"
              />
            </Link>
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelinePetitionCreatedEvent.fragments = {
  PetitionCreatedEvent: gql`
    fragment TimelinePetitionCreatedEvent_PetitionCreatedEvent on PetitionCreatedEvent {
      user {
        id
        fullName
      }
      createdAt
    }
  `,
};
