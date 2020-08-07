import { gql } from "@apollo/client";
import { Box, Link, Text, useDisclosure } from "@chakra-ui/core";
import { EmailSentIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { MessageSentEventModal } from "@parallel/components/common/MessageSentEventModal";
import { MessageEventsIndicator } from "@parallel/components/petition-activity/MessageEventsIndicator";
import { TimelineMessageSentEvent_MessageSentEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineMessageSentEventProps = {
  userId: string;
  event: TimelineMessageSentEvent_MessageSentEventFragment;
};

export function TimelineMessageSentEvent({
  event: { message, createdAt },
  userId,
}: TimelineMessageSentEventProps) {
  const {
    isOpen: isEmailOpen,
    onOpen: onOpenEmail,
    onClose: onCloseEmail,
  } = useDisclosure();

  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<EmailSentIcon />}
          color="black"
          backgroundColor="gray.200"
        />
      }
    >
      <Box onClick={onOpenEmail}>
        {message.scheduledAt ? (
          <FormattedMessage
            id="timeline.message-sent-description-scheduled"
            defaultMessage="A message scheduled by {same, select, true {you} other {<b>{user}</b>}} {subject, select, null {without subject} other {with subject <b>{subject}</b>}} was sent to {contact} {timeAgo}"
            values={{
              same: userId === message.sender!.id,
              b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
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
            id="timeline.message-sent-description-manual"
            defaultMessage="{same, select, true {You} other {<b>{user}</b>}} sent a message {subject, select, null {without subject} other {with subject <b>{subject}</b>}} to {contact} {timeAgo}"
            values={{
              same: userId === message.sender!.id,
              b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
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
      </Box>
      <MessageSentEventModal
        message={message}
        isOpen={isEmailOpen}
        onClose={onCloseEmail}
      />
    </TimelineItem>
  );
}

TimelineMessageSentEvent.fragments = {
  MessageSentEvent: gql`
    fragment TimelineMessageSentEvent_MessageSentEvent on MessageSentEvent {
      message {
        sender {
          id
          fullName
        }
        emailSubject
        emailBody
        scheduledAt
        access {
          contact {
            ...ContactLink_Contact
          }
        }
        ...MessageEventsIndicator_PetitionMessage
      }
      createdAt
      ...MessageSentEventModal_MessageSentEvent
    }
    ${MessageEventsIndicator.fragments.PetitionMessage}
    ${ContactLink.fragments.Contact}
    ${MessageSentEventModal.fragments.MessageSentEvent}
  `,
};
