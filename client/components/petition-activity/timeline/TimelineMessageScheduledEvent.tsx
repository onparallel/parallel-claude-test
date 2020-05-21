import { Link, Text } from "@chakra-ui/core";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { MessageEventsIndicator } from "@parallel/components/petition-activity/MessageEventsIndicator";
import { TimelineMessageScheduledEvent_MessageScheduledEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { gql } from "apollo-boost";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineMessageScheduledEventProps = {
  userId: string;
  event: TimelineMessageScheduledEvent_MessageScheduledEventFragment;
};

export function TimelineMessageScheduledEvent({
  event,
  userId,
}: TimelineMessageScheduledEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon icon="time" color="black" backgroundColor="gray.200" />
      }
    >
      <>
        <FormattedMessage
          id="timeline.message-Scheduled-description-manual"
          defaultMessage="{same, select, true {You} other {<b>{user}</b>}} scheduled a message {subject, select, null {without subject} other {with subject <i>{subject}</i>}} to {contact} {timeAgo}"
          values={{
            same: userId === event.message.sender!.id,
            b: (...chunks: any[]) => <Text as="strong">{chunks}</Text>,
            i: (...chunks: any[]) => (
              <Text as="em" textDecoration="underline" fontStyle="normal">
                {chunks}
              </Text>
            ),
            user: event.message.sender!.fullName,
            subject: event.message.emailSubject,
            contact: event.access.contact ? (
              <ContactLink contact={event.access.contact} />
            ) : (
              <DeletedContact />
            ),
            timeAgo: (
              <Link>
                <DateTime
                  value={event.createdAt}
                  format={FORMATS.LLL}
                  useRelativeTime="always"
                />
              </Link>
            ),
          }}
        />
        <MessageEventsIndicator message={event.message} marginLeft={2} />
      </>
    </TimelineItem>
  );
}

TimelineMessageScheduledEvent.fragments = {
  MessageScheduledEvent: gql`
    fragment TimelineMessageScheduledEvent_MessageScheduledEvent on MessageScheduledEvent {
      message {
        sender {
          id
          fullName
        }
        emailSubject
        ...MessageEventsIndicator_PetitionMessage
      }
      access {
        contact {
          ...ContactLink_Contact
        }
      }
      createdAt
    }
    ${MessageEventsIndicator.fragments.PetitionMessage}
    ${ContactLink.fragments.Contact}
  `,
};
