import { gql } from "@apollo/client";
import { Link } from "@chakra-ui/core";
import { CheckIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { TimelinePetitionCompletedEvent_PetitionCompletedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelinePetitionCompletedEventProps = {
  event: TimelinePetitionCompletedEvent_PetitionCompletedEventFragment;
};

export function TimelinePetitionCompletedEvent({
  event,
}: TimelinePetitionCompletedEventProps) {
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

TimelinePetitionCompletedEvent.fragments = {
  PetitionCompletedEvent: gql`
    fragment TimelinePetitionCompletedEvent_PetitionCompletedEvent on PetitionCompletedEvent {
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
