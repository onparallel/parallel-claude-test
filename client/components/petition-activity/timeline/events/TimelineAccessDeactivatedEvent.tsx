import { gql } from "@apollo/client";
import { UserXIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineAccessDeactivatedEventProps {
  event: TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragment;
}

export function TimelineAccessDeactivatedEvent({ event }: TimelineAccessDeactivatedEventProps) {
  return (
    <TimelineItem icon={<TimelineIcon icon={UserXIcon} color="white" backgroundColor="red.500" />}>
      {event.reason === "DEACTIVATED_BY_USER" ? (
        event.access.isContactless ? (
          <FormattedMessage
            id="component.timeline-access-deactivated-event.description-contactless"
            defaultMessage="{user} deactivated a link access {timeAgo}"
            values={{
              user: <UserReference user={event.user} />,
              timeAgo: (
                <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
              ),
            }}
          />
        ) : (
          <FormattedMessage
            id="component.timeline-access-deactivated-event.description"
            defaultMessage="{user} removed access to {contact} {timeAgo}"
            values={{
              user: <UserReference user={event.user} />,
              contact: <ContactReference contact={event.access.contact} />,
              timeAgo: (
                <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
              ),
            }}
          />
        )
      ) : event.reason === "EMAIL_BOUNCED" ? (
        <FormattedMessage
          id="component.timeline-access-deactivated-event.description-bounce"
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
          id="component.timeline-access-deactivated-event.description-generic"
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
        isContactless
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
  `,
};
