import { gql } from "@apollo/client";
import { CheckIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineContactUnsubscribeEvent_ContactUnsubscribeEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineContactUnsubscribeEventProps = {
  event: TimelineContactUnsubscribeEvent_ContactUnsubscribeEventFragment;
};

export function TimelineContactUnsubscribeEvent({
  event,
}: TimelineContactUnsubscribeEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<CheckIcon />}
          color="white"
          backgroundColor="green.500"
        />
      }
    >
      <FormattedMessage
        id="timeline.petition-completed-description"
        defaultMessage="{contact} completed the petition {timeAgo}"
        values={{
          contact: <ContactLink contact={event.access.contact} />,
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

TimelineContactUnsubscribeEvent.fragments = {
  ContactUnsubscribeEvent: gql`
    fragment TimelineContactUnsubscribeEvent_ContactUnsubscribeEvent on ContactUnsubscribeEvent {
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
