import { gql } from "@apollo/client";
import { UserPlusIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineAccessDelegatedEvent_AccessDelegatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineAccessDelegatedEventProps = {
  event: TimelineAccessDelegatedEvent_AccessDelegatedEventFragment;
};

export function TimelineAccessDelegatedEvent({ event }: TimelineAccessDelegatedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<UserPlusIcon />} color="white" backgroundColor="blue.500" />}
    >
      <FormattedMessage
        id="timeline.access-delegated-description"
        defaultMessage="{contact} has delegated the petition to {newContact} {timeAgo}"
        values={{
          contact: <ContactLink contact={event.originalAccess.contact} />,
          newContact: <ContactLink contact={event.newAccess.contact} />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelineAccessDelegatedEvent.fragments = {
  AccessDelegatedEvent: gql`
    fragment TimelineAccessDelegatedEvent_AccessDelegatedEvent on AccessDelegatedEvent {
      originalAccess {
        contact {
          ...ContactLink_Contact
        }
      }
      newAccess {
        contact {
          ...ContactLink_Contact
        }
      }
      createdAt
    }
    ${ContactLink.fragments.Contact}
  `,
};
