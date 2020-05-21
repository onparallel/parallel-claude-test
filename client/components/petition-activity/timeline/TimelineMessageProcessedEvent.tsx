import { Link, Text } from "@chakra-ui/core";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { MessageEventsIndicator } from "@parallel/components/petition-activity/MessageEventsIndicator";
import { TimelineMessageProcessedEvent_MessageProcessedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { gql } from "apollo-boost";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineMessageProcessedEventProps = {
  userId: string;
  event: TimelineMessageProcessedEvent_MessageProcessedEventFragment;
};

export function TimelineMessageProcessedEvent({
  event,
  userId,
}: TimelineMessageProcessedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon="email-sent"
          color="black"
          backgroundColor="gray.200"
        />
      }
    >
      <>
        {event.message.scheduledAt ? (
          <FormattedMessage
            id="timeline.message-processed-description-manual"
            defaultMessage="A message scheduled by {same, select, true {you} other {<b>{user}</b>}} {subject, select, null {without subject} other {with subject <i>{subject}</i>}} was sent to {contact} {timeAgo}"
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
        ) : (
          <FormattedMessage
            id="timeline.message-processed-description-manual"
            defaultMessage="{same, select, true {You} other {<b>{user}</b>}} sent a message {subject, select, null {without subject} other {with subject <i>{subject}</i>}} to {contact} {timeAgo}"
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
        )}
        <MessageEventsIndicator message={event.message} marginLeft={2} />
      </>
    </TimelineItem>
  );
}

TimelineMessageProcessedEvent.fragments = {
  MessageProcessedEvent: gql`
    fragment TimelineMessageProcessedEvent_MessageProcessedEvent on MessageProcessedEvent {
      message {
        sender {
          id
          fullName
        }
        emailSubject
        scheduledAt
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
