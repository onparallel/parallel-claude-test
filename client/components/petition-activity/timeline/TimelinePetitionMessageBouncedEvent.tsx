import { gql } from "@apollo/client";
import { EmailXIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionMessageBouncedEvent_PetitionMessageBouncedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

type TimelinePetitionMessageBouncedEventProps = {
  event: TimelinePetitionMessageBouncedEvent_PetitionMessageBouncedEventFragment;
};

export function TimelinePetitionMessageBouncedEvent({
  event,
}: TimelinePetitionMessageBouncedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<EmailXIcon />} color="white" backgroundColor="red.500" />}
    >
      <FormattedMessage
        id="timeline.petition-message-bounced-description"
        defaultMessage="We could not deliver the petition to contact {contactName} {timeAgo}"
        values={{
          contactName: <ContactLink contact={event.message.access.contact} />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelinePetitionMessageBouncedEvent.fragments = {
  PetitionMessageBouncedEvent: gql`
    fragment TimelinePetitionMessageBouncedEvent_PetitionMessageBouncedEvent on PetitionMessageBouncedEvent {
      message {
        access {
          contact {
            ...ContactLink_Contact
          }
        }
      }
      createdAt
    }
    ${ContactLink.fragments.Contact}
  `,
};
