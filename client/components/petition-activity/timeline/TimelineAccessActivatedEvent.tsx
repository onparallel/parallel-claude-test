import { gql } from "@apollo/client";
import { Link, Text } from "@chakra-ui/core";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { TimelineAccessActivatedEvent_AccessActivatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";
import { UserPlusIcon } from "@parallel/chakra/icons";

export type TimelineAccessActivatedEventProps = {
  userId: string;
  event: TimelineAccessActivatedEvent_AccessActivatedEventFragment;
};

export function TimelineAccessActivatedEvent({
  event,
  userId,
}: TimelineAccessActivatedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<UserPlusIcon />}
          color="white"
          backgroundColor="blue.500"
        />
      }
    >
      <FormattedMessage
        id="timeline.access-activated-description"
        defaultMessage="{same, select, true {You} other {<b>{user}</b>}} gave access to {contact} {timeAgo}"
        values={{
          same: userId === event.user.id,
          b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
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

TimelineAccessActivatedEvent.fragments = {
  AccessActivatedEvent: gql`
    fragment TimelineAccessActivatedEvent_AccessActivatedEvent on AccessActivatedEvent {
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
