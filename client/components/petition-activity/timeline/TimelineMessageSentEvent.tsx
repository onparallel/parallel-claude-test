import { gql } from "@apollo/client";
import { Box, Button, Flex } from "@chakra-ui/react";
import { EmailSentIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { EmailEventsIndicator } from "@parallel/components/petition-activity/EmailEventsIndicator";
import { TimelineMessageSentEvent_MessageSentEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import {
  SentPetitionMessageDialog,
  useSentPetitionMessageDialog,
} from "../dialogs/SentPetitionMessageDialog";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineMessageSentEventProps = {
  userId: string;
  event: TimelineMessageSentEvent_MessageSentEventFragment;
};

export function TimelineMessageSentEvent({
  event: { message, createdAt },
  userId,
}: TimelineMessageSentEventProps) {
  const showSentPetitionMessage = useSentPetitionMessageDialog();
  async function handleSeeMessageClick() {
    try {
      await showSentPetitionMessage({ message });
    } catch {}
  }
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<EmailSentIcon />} color="black" backgroundColor="gray.200" />}
    >
      <Flex alignItems="center">
        <Box>
          {message.scheduledAt ? (
            message.access.delegateGranter ? (
              <FormattedMessage
                id="timeline.message-sent-description-scheduled-delegated"
                defaultMessage="A message scheduled by {delegateIsYou, select, true {you} other {{delegate}}} as {senderIsYou, select, true {you} other {{sender}}} {subject, select, null {without subject} other {with subject <b>{subject}</b>}} was sent to {contact} {timeAgo}"
                values={{
                  senderIsYou: userId === message.sender?.id,
                  delegateIsYou: userId === message.access.delegateGranter?.id,
                  delegate: <UserReference user={message.access.delegateGranter} />,
                  sender: <UserReference user={message.sender} />,
                  subject: message.emailSubject,
                  contact: <ContactReference contact={message.access.contact} />,
                  timeAgo: (
                    <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                  ),
                }}
              />
            ) : (
              <FormattedMessage
                id="timeline.message-sent-description-scheduled"
                defaultMessage="A message scheduled by {senderIsYou, select, true {you} other {{sender}}} {subject, select, null {without subject} other {with subject <b>{subject}</b>}} was sent to {contact} {timeAgo}"
                values={{
                  senderIsYou: userId === message.sender?.id,
                  sender: <UserReference user={message.sender} />,
                  subject: message.emailSubject,
                  contact: <ContactReference contact={message.access.contact} />,
                  timeAgo: (
                    <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                  ),
                }}
              />
            )
          ) : message.access.delegateGranter ? (
            <FormattedMessage
              id="timeline.message-sent-description-manual-delegated"
              defaultMessage="{senderIsYou, select, true {You} other {{delegate}}} sent a message as {senderIsYou, select, true {you} other {{sender}}} {subject, select, null {without subject} other {with subject <b>{subject}</b>}} to {contact} {timeAgo}"
              values={{
                senderIsYou: userId === message.sender?.id,
                delegateIsYou: userId === message.access.delegateGranter?.id,
                delegate: <UserReference user={message.access.delegateGranter} />,
                sender: <UserReference user={message.sender} />,
                subject: message.emailSubject,
                contact: <ContactReference contact={message.access.contact} />,
                timeAgo: (
                  <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          ) : (
            <FormattedMessage
              id="timeline.message-sent-description-manual"
              defaultMessage="{senderIsYou, select, true {You} other {{sender}}} sent a message {subject, select, null {without subject} other {with subject <b>{subject}</b>}} to {contact} {timeAgo}"
              values={{
                senderIsYou: userId === message.sender!.id,
                sender: <UserReference user={message.sender} />,
                subject: message.emailSubject,
                contact: <ContactReference contact={message.access.contact} />,
                timeAgo: (
                  <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          )}
          <EmailEventsIndicator event={message} marginLeft={2} />
        </Box>
        {message.emailBody ? (
          <Button onClick={handleSeeMessageClick} size="sm" variant="outline" marginLeft={4}>
            <FormattedMessage id="timeline.message-sent-see-message" defaultMessage="See message" />
          </Button>
        ) : null}
      </Flex>
    </TimelineItem>
  );
}

TimelineMessageSentEvent.fragments = {
  MessageSentEvent: gql`
    fragment TimelineMessageSentEvent_MessageSentEvent on MessageSentEvent {
      message {
        sender {
          ...UserReference_User
        }
        emailSubject
        scheduledAt
        access {
          delegateGranter {
            ...UserReference_User
          }
          contact {
            ...ContactReference_Contact
          }
        }
        ...EmailEventsIndicator_PetitionMessage
        ...SentPetitionMessageDialog_PetitionMessage
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
    ${EmailEventsIndicator.fragments.PetitionMessage}
    ${SentPetitionMessageDialog.fragments.PetitionMessage}
  `,
};
