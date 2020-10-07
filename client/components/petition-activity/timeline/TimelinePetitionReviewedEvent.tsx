import { gql } from "@apollo/client";
import { Link, Text } from "@chakra-ui/core";
import { DoubleCheckIcon } from "@parallel/chakra/icons";

import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionReviewedEvent_PetitionReviewedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelinePetitionReviewedEventProps = {
  userId: string;
  event: TimelinePetitionReviewedEvent_PetitionReviewedEventFragment;
};

export function TimelinePetitionReviewedEvent({
  event,
  userId,
}: TimelinePetitionReviewedEventProps) {
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
        id="timeline.petition-reviewed-description"
        defaultMessage="{same, select, true {You} other {{user}}} reviewed the petition {timeAgo}"
        values={{
          same: userId === event.user?.id,
          b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
          user: <UserReference user={event.user} />,
          timeAgo: (
            <Link>
              <DateTime
                value={event.createdAt}
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

TimelinePetitionReviewedEvent.fragments = {
  PetitionReviewedEvent: gql`
    fragment TimelinePetitionReviewedEvent_PetitionReviewedEvent on PetitionReviewedEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactLink.fragments.Contact}
  `,
};
