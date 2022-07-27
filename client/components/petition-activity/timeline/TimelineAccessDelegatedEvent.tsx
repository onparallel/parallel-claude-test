import { gql } from "@apollo/client";
import { UserPlusIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
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
      icon={<TimelineIcon icon={UserPlusIcon} color="white" backgroundColor="blue.500" />}
    >
      <FormattedMessage
        id="timeline.access-delegated-description"
        defaultMessage="{contact} has delegated the parallel to {newContact} {timeAgo}"
        values={{
          contact: <ContactReference contact={event.originalAccess.contact} />,
          newContact: <ContactReference contact={event.newAccess.contact} />,
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
          ...ContactReference_Contact
        }
      }
      newAccess {
        contact {
          ...ContactReference_Contact
        }
      }
      createdAt
    }
    ${ContactReference.fragments.Contact}
  `,
};
