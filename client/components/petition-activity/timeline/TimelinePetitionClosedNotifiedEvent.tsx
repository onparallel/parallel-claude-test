import { gql } from "@apollo/client";
import { Link } from "@chakra-ui/core";
import { ThumbUpIcon } from "@parallel/chakra/icons";

import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelinePetitionClosedNotifiedEventProps = {
  userId: string;
  event: TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEventFragment;
};

export function TimelinePetitionClosedNotifiedEvent({
  event,
  userId,
}: TimelinePetitionClosedNotifiedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<ThumbUpIcon />}
          color="white"
          backgroundColor="blue.500"
        />
      }
    >
      <FormattedMessage
        id="timeline.petition-correct-notified-description"
        defaultMessage="{same, select, true {You} other {{user}}} notified {contact} that the petition is correct {timeAgo}"
        values={{
          same: userId === event.user?.id,
          contact: <ContactLink contact={event.access.contact!} />,
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

TimelinePetitionClosedNotifiedEvent.fragments = {
  PetitionClosedNotifiedEvent: gql`
    fragment TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEvent on PetitionClosedNotifiedEvent {
      user {
        ...UserReference_User
      }
      access {
        contact {
          ...ContactLink_Contact
        }
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactLink.fragments.Contact}
  `,
};
