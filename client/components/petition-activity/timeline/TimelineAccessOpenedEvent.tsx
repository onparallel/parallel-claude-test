import { gql } from "@apollo/client";
import { EyeIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { TimelineAccessOpenedEvent_AccessOpenedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineAccessOpenedEventProps = {
  event: TimelineAccessOpenedEvent_AccessOpenedEventFragment;
};

export function TimelineAccessOpenedEvent({
  event,
}: TimelineAccessOpenedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<EyeIcon />}
          color="white"
          backgroundColor="blue.500"
        />
      }
    >
      <FormattedMessage
        id="timeline.access-opened-description"
        defaultMessage="{contact} opened the petition {timeAgo}"
        values={{
          contact: event.access.contact ? (
            <ContactLink contact={event.access.contact} />
          ) : (
            <DeletedContact />
          ),
          timeAgo: (
            <DateTime
              value={event.createdAt}
              format={FORMATS.LLL}
              useRelativeTime="always"
            />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelineAccessOpenedEvent.fragments = {
  AccessOpenedEvent: gql`
    fragment TimelineAccessOpenedEvent_AccessOpenedEvent on AccessOpenedEvent {
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
