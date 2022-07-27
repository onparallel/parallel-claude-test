import { gql } from "@apollo/client";
import { UserPlusIcon } from "@parallel/chakra/icons";
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
      icon={<TimelineIcon icon={UserPlusIcon} color="white" backgroundColor="blue.500" />}
    >
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
