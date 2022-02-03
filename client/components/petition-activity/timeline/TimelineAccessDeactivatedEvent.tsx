import { gql } from "@apollo/client";
import { UserXIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

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
      icon={<TimelineIcon icon={<UserXIcon />} color="white" backgroundColor="red.500" />}
    >
      {event.isManualTrigger ? (
        <FormattedMessage
          id="timeline.access-deactivated-manual-description"
          defaultMessage="{same, select, true {You} other {{user}}} removed access to {contact} {timeAgo}"
          values={{
            same: userId === event.user?.id,
            user: <UserReference user={event.user} />,
            contact: <ContactReference contact={event.access.contact} />,
            timeAgo: (
              <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
            ),
          }}
        />
      ) : (
        <FormattedMessage
          id="timeline.access-deactivated-auto-description"
          defaultMessage="We removed access to {contact} because an email was bounced {timeAgo}"
          values={{
            contact: <ContactReference contact={event.access.contact} />,
            timeAgo: (
              <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
            ),
          }}
        />
      )}
    </TimelineItem>
  );
}

TimelineAccessDeactivatedEvent.fragments = {
  AccessDeactivatedEvent: gql`
    fragment TimelineAccessDeactivatedEvent_AccessDeactivatedEvent on AccessDeactivatedEvent {
      isManualTrigger
      user {
        ...UserReference_User
      }
      access {
        contact {
          ...ContactReference_Contact
        }
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
  `,
};
