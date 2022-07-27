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
    <TimelineItem icon={<TimelineIcon icon={UserXIcon} color="white" backgroundColor="red.500" />}>
      {event.reason === "DEACTIVATED_BY_USER" ? (
        <FormattedMessage
          id="timeline.access-deactivated-manual-description"
          defaultMessage="{userIsYou, select, true {You} other {{user}}} removed access to {contact} {timeAgo}"
          values={{
            userIsYou: userId === event.user?.id,
            user: <UserReference user={event.user} />,
            contact: <ContactReference contact={event.access.contact} />,
            timeAgo: (
              <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
            ),
          }}
        />
      ) : event.reason === "EMAIL_BOUNCED" ? (
        <FormattedMessage
          id="timeline.access-deactivated-auto-description"
          defaultMessage="The access for {contact} was removed because the email bounced {timeAgo}"
          values={{
            contact: <ContactReference contact={event.access.contact} />,
            timeAgo: (
              <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
            ),
          }}
        />
      ) : (
        <FormattedMessage
          id="timeline.access-deactivated-generic-description"
          defaultMessage="The access for {contact} was removed {timeAgo}"
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
      reason
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
