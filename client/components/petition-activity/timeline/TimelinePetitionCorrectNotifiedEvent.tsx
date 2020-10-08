import { gql } from "@apollo/client";
import { Link } from "@chakra-ui/core";
import { ThumbUpIcon } from "@parallel/chakra/icons";

import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionCorrectNotifiedEvent_PetitionCorrectNotifiedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelinePetitionCorrectNotifiedEventProps = {
  userId: string;
  event: TimelinePetitionCorrectNotifiedEvent_PetitionCorrectNotifiedEventFragment;
};

export function TimelinePetitionCorrectNotifiedEvent({
  event,
  userId,
}: TimelinePetitionCorrectNotifiedEventProps) {
  console.log(event);
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
        defaultMessage="{same, select, true {You} other {{user}}} notified {count, plural, =1{{contact}} other{# contacts} } that the petition is correct {timeAgo}"
        values={{
          same: userId === event.user?.id,
          count: event.notifiedAccesses?.length || 1,
          contact: (
            <ContactLink contact={event.notifiedAccesses![0]!.contact!} />
          ),
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

TimelinePetitionCorrectNotifiedEvent.fragments = {
  PetitionCorrectNotifiedEvent: gql`
    fragment TimelinePetitionCorrectNotifiedEvent_PetitionCorrectNotifiedEvent on PetitionCorrectNotifiedEvent {
      user {
        ...UserReference_User
      }
      notifiedAccesses {
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
