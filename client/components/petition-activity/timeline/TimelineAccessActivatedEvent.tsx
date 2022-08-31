import { gql } from "@apollo/client";
import { PaperclipIcon, UserPlusIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineAccessActivatedEvent_AccessActivatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

type TimelineAccessActivatedEventProps = {
  userId: string;
  event: TimelineAccessActivatedEvent_AccessActivatedEventFragment;
};

export function TimelineAccessActivatedEvent({ event, userId }: TimelineAccessActivatedEventProps) {
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
      {event.access.isContactless ? (
        event.access.delegateGranter ? (
          <FormattedMessage
            id="timeline.contactless-access-activated-description.delegated"
            defaultMessage="{delegateIsYou, select, true {You} other {{delegate}}} created a link access as {userIsYou, select, true {you} other {{user}}} {timeAgo}"
            values={{
              delegateIsYou: userId === event.access.delegateGranter.id,
              delegate: <UserReference user={event.access.delegateGranter} />,
              userIsYou: userId === event.user?.id,
              user: <UserReference user={event.user} />,
              timeAgo: (
                <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
              ),
            }}
          />
        ) : (
          <FormattedMessage
            id="timeline.contactless-access-activated-description"
            defaultMessage="{userIsYou, select, true {You} other {{user}}} created a link access {timeAgo}"
            values={{
              userIsYou: userId === event.user?.id,
              user: <UserReference user={event.user} />,
              timeAgo: (
                <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
              ),
            }}
          />
        )
      ) : event.access.delegateGranter ? (
        <FormattedMessage
          id="timeline.access-activated-description.delegated"
          defaultMessage="{delegateIsYou, select, true {You} other {{delegate}}} gave access to {contact} as {userIsYou, select, true {you} other {{user}}} {timeAgo}"
          values={{
            delegateIsYou: userId === event.access.delegateGranter.id,
            delegate: <UserReference user={event.access.delegateGranter} />,
            userIsYou: userId === event.user?.id,
            user: <UserReference user={event.user} />,
            contact: <ContactReference contact={event.access.contact} />,
            timeAgo: (
              <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
            ),
          }}
        />
      ) : (
        <FormattedMessage
          id="timeline.access-activated-description"
          defaultMessage="{userIsYou, select, true {You} other {{user}}} gave access to {contact} {timeAgo}"
          values={{
            userIsYou: userId === event.user?.id,
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
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
  `,
};
