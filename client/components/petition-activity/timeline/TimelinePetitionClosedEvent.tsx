import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { DoubleCheckIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
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

export function TimelinePetitionClosedEvent({
  event,
  userId,
}: TimelinePetitionClosedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<DoubleCheckIcon />}
          color="white"
          backgroundColor="green.500"
        />
      }
    >
      <FormattedMessage
        id="timeline.petition-closed-description"
        defaultMessage="{same, select, true {You} other {{user}}} closed the petition {timeAgo}"
        values={{
          same: userId === event.user?.id,
          b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
          user: <UserReference user={event.user} />,
          timeAgo: (
            <DateTime
              value={event.createdAt}
              format={FORMATS.LLL}
              useRelativeTime="always"
            />
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
    ${ContactLink.fragments.Contact}
  `,
};
