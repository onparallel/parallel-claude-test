import { gql } from "@apollo/client";
import { Box, Button, Flex, Link, Text, useDisclosure } from "@chakra-ui/core";
import { EmailSentIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { MessageSentEventModal } from "@parallel/components/petition-activity/MessageSentEventModal";
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
  const { isOpen, onClose, onOpen } = useDisclosure();

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
      <Flex alignItems="center">
        <Box>
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
        <Button onClick={onOpen} size="sm" variant="outline" marginLeft={4}>
          <FormattedMessage
            id="timeline.message-sent-see-message"
            defaultMessage="See message"
          />
        </Button>
      </Flex>
      <MessageSentEventModal
        message={message}
        isOpen={isOpen}
        onClose={onClose}
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
        ...MessageSentEventModal_PetitionMessage
      }
      createdAt
    }
    ${MessageEventsIndicator.fragments.PetitionMessage}
    ${ContactLink.fragments.Contact}
    ${MessageSentEventModal.fragments.PetitionMessage}
  `,
};
