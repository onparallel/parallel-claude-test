import { gql } from "@apollo/client";
import { PaperclipIcon, UserPlusIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineAccessActivatedEvent_AccessActivatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

interface TimelineAccessActivatedEventProps {
  event: TimelineAccessActivatedEvent_AccessActivatedEventFragment;
}

export function TimelineAccessActivatedEvent({ event }: TimelineAccessActivatedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={event.access.isContactless ? PaperclipIcon : UserPlusIcon}
          color="white"
          backgroundColor="blue.500"
        />
      }
    >
      {event.access.isSharedByLink ? (
        event.access.delegateGranter ? (
          <FormattedMessage
            id="component.timeline-access-activated-event.contactless-access-delegated"
            defaultMessage="{delegate} created a link access as {user} {timeAgo}"
            values={{
              delegate: <UserReference user={event.access.delegateGranter} />,
              user: <UserReference user={event.user} />,
              timeAgo: (
                <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
              ),
            }}
          />
        ) : (
          <FormattedMessage
            id="component.timeline-access-activated-event.contactless-access-activated"
            defaultMessage="{user} created a link access {timeAgo}"
            values={{
              user: <UserReference user={event.user} />,
              timeAgo: (
                <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
              ),
            }}
          />
        )
      ) : event.access.delegateGranter ? (
        <FormattedMessage
          id="component.timeline-access-activated-event.access-delegated"
          defaultMessage="{delegate} sent an access to {contact} as {user} {timeAgo}"
          values={{
            delegate: <UserReference user={event.access.delegateGranter} />,
            user: <UserReference user={event.user} />,
            contact: <ContactReference contact={event.access.contact} />,
            timeAgo: (
              <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
            ),
          }}
        />
      ) : (
        <FormattedMessage
          id="component.timeline-access-activated-event.access-activated"
          defaultMessage="{user} sent an access to {contact} {timeAgo}"
          values={{
            user: <UserReference user={event.user} />,
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

TimelineAccessActivatedEvent.fragments = {
  AccessActivatedEvent: gql`
    fragment TimelineAccessActivatedEvent_AccessActivatedEvent on AccessActivatedEvent {
      user {
        ...UserReference_User
      }
      access {
        delegateGranter {
          ...UserReference_User
        }
        contact {
          ...ContactReference_Contact
        }
        isContactless
        isSharedByLink
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
  `,
};
