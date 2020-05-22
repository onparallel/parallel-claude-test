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
  event: { message, createdAt },
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
        {message.scheduledAt ? (
          <FormattedMessage
            id="timeline.message-processed-description-scheduled"
            defaultMessage="A message scheduled by {same, select, true {you} other {<b>{user}</b>}} {subject, select, null {without subject} other {with subject <b>{subject}</b>}} was sent to {contact} {timeAgo}"
            values={{
              same: userId === message.sender!.id,
              b: (...chunks: any[]) => <Text as="strong">{chunks}</Text>,
              user: message.sender!.fullName,
              subject: message.emailSubject,
              contact: message.access.contact ? (
                <ContactLink contact={message.access.contact} />
              ) : (
                <DeletedContact />
              ),
              timeAgo: (
                <Link>
                  <DateTime
                    value={createdAt}
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
            defaultMessage="{same, select, true {You} other {<b>{user}</b>}} sent a message {subject, select, null {without subject} other {with subject <b>{subject}</b>}} to {contact} {timeAgo}"
            values={{
              same: userId === message.sender!.id,
              b: (...chunks: any[]) => <Text as="strong">{chunks}</Text>,
              user: message.sender!.fullName,
              subject: message.emailSubject,
              contact: message.access.contact ? (
                <ContactLink contact={message.access.contact} />
              ) : (
                <DeletedContact />
              ),
              timeAgo: (
                <Link>
                  <DateTime
                    value={createdAt}
                    format={FORMATS.LLL}
                    useRelativeTime="always"
                  />
                </Link>
              ),
            }}
          />
        )}
        <MessageEventsIndicator message={message} marginLeft={2} />
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
        access {
          contact {
            ...ContactLink_Contact
          }
        }
        ...MessageEventsIndicator_PetitionMessage
      }
      createdAt
    }
    ${MessageEventsIndicator.fragments.PetitionMessage}
    ${ContactLink.fragments.Contact}
  `,
};
