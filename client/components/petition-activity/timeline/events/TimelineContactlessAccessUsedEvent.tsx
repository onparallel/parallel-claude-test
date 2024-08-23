import { gql } from "@apollo/client";
import { UserPlusIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineContactlessAccessUsedEvent_ContactlessAccessUsedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineContactlessAccessUsedEventProps {
  event: TimelineContactlessAccessUsedEvent_ContactlessAccessUsedEventFragment;
}

export function TimelineContactlessAccessUsedEvent({
  event,
}: TimelineContactlessAccessUsedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={UserPlusIcon} color="white" backgroundColor="blue.500" />}
    >
      <FormattedMessage
        id="component.timeline-contactless-access-used-event.contactless-access-used"
        defaultMessage="{contact} accessed the link {timeAgo}"
        values={{
          contact: <ContactReference contact={event.access.contact} />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelineContactlessAccessUsedEvent.fragments = {
  ContactlessAccessUsedEvent: gql`
    fragment TimelineContactlessAccessUsedEvent_ContactlessAccessUsedEvent on ContactlessAccessUsedEvent {
      access {
        contact {
          ...ContactReference_Contact
        }
      }
      createdAt
    }
    ${ContactReference.fragments.Contact}
  `,
};
