import { gql } from "@apollo/client";
import { SignaturePlusIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineRecipientSignedEvent_RecipientSignedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineRecipientSignedEventProps = {
  event: TimelineRecipientSignedEvent_RecipientSignedEventFragment;
};

export function TimelineRecipientSignedEvent({
  event: { contact, createdAt },
}: TimelineRecipientSignedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<SignaturePlusIcon />} color="black" backgroundColor="gray.200" />}
    >
      <FormattedMessage
        id="timeline.recipient-signed-description"
        defaultMessage="{contact} signed the document {timeAgo}"
        values={{
          contact: <ContactLink contact={contact} />,
          timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
        }}
      />
    </TimelineItem>
  );
}

TimelineRecipientSignedEvent.fragments = {
  RecipientSignedEvent: gql`
    fragment TimelineRecipientSignedEvent_RecipientSignedEvent on RecipientSignedEvent {
      contact {
        ...ContactLink_Contact
      }
      createdAt
    }
    ${ContactLink.fragments.Contact}
  `,
};
