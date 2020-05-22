import { TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragment } from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { Text, Link } from "@chakra-ui/core";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { DateTime } from "@parallel/components/common/DateTime";
import { FORMATS } from "@parallel/utils/dates";

export type TimelineAccessDeactivatedEventProps = {
  userId: string;
  event: TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragment;
};

export function TimelineAccessDeactivatedEvent({
  event,
  userId,
}: TimelineAccessDeactivatedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon icon="user-x" color="white" backgroundColor="red.500" />
      }
    >
      <FormattedMessage
        id="timeline.access-deactivated-description"
        defaultMessage="{same, select, true {You} other {<b>{user}</b>}} removed access to {contact} {timeAgo}"
        values={{
          same: userId === event.user.id,
          b: (...chunks: any[]) => <Text as="strong">{chunks}</Text>,
          user: event.user.fullName,
          contact: event.access.contact ? (
            <ContactLink contact={event.access.contact} />
          ) : (
            <DeletedContact />
          ),
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

TimelineAccessDeactivatedEvent.fragments = {
  AccessDeactivatedEvent: gql`
    fragment TimelineAccessDeactivatedEvent_AccessDeactivatedEvent on AccessDeactivatedEvent {
      user {
        id
        fullName
      }
      access {
        contact {
          ...ContactLink_Contact
        }
      }
      createdAt
    }
    ${ContactLink.fragments.Contact}
  `,
};
