import { gql } from "@apollo/client";
import { Box, Button, Flex } from "@chakra-ui/react";
import { TimeIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineMessageScheduledEvent_MessageScheduledEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import {
  SentPetitionMessageDialog,
  useSentPetitionMessageDialog,
} from "../dialogs/SentPetitionMessageDialog";

import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineMessageScheduledEventProps = {
  userId: string;
  event: TimelineMessageScheduledEvent_MessageScheduledEventFragment;
  onCancelScheduledMessage: () => void;
};

export function TimelineMessageScheduledEvent({
  event: { message, createdAt },
  userId,
  onCancelScheduledMessage,
}: TimelineMessageScheduledEventProps) {
  const showSentPetitionMessage = useSentPetitionMessageDialog();
  async function handleSeeMessageClick() {
    try {
      await showSentPetitionMessage({ message });
    } catch {}
  }
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<TimeIcon />} color="black" backgroundColor="gray.200" />}
    >
      <Flex alignItems="center">
        <Box>
          {message.access.delegateGranter ? (
            <FormattedMessage
              id="timeline.message-scheduled-description-delegated"
              defaultMessage="{delegateIsYou, select, true {You} other {{delegate}}} scheduled a message as {senderIsYou, select, true {you} other {{sender}}} for {scheduledAt} {subject, select, null {without subject} other {with subject <b>{subject}</b>}} to {contact} {timeAgo}"
              values={{
                senderIsYou: userId === message.sender?.id,
                delegateIsYou: userId === message.access.delegateGranter?.id,
                delegate: <UserReference user={message.access.delegateGranter} />,
                sender: <UserReference user={message.sender} />,
                subject: message.emailSubject,
                contact: <ContactReference contact={message.access.contact} />,
                scheduledAt: (
                  <DateTime fontWeight="bold" value={message.scheduledAt!} format={FORMATS.LLL} />
                ),
                timeAgo: (
                  <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          ) : (
            <FormattedMessage
              id="timeline.message-scheduled-description"
              defaultMessage="{senderIsYou, select, true {You} other {{sender}}} scheduled a message for {scheduledAt} {subject, select, null {without subject} other {with subject <b>{subject}</b>}} to {contact} {timeAgo}"
              values={{
                senderIsYou: userId === message.sender?.id,
                sender: <UserReference user={message.sender} />,
                subject: message.emailSubject,
                contact: <ContactReference contact={message.access.contact} />,
                scheduledAt: (
                  <DateTime fontWeight="bold" value={message.scheduledAt!} format={FORMATS.LLL} />
                ),
                timeAgo: (
                  <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          )}
        </Box>
        {message.emailBody ? (
          <Button onClick={handleSeeMessageClick} size="sm" variant="outline" marginLeft={4}>
            <FormattedMessage id="timeline.message-sent-see-message" defaultMessage="See message" />
          </Button>
        ) : null}
        {message.status === "SCHEDULED" ? (
          <Button
            size="sm"
            variant="outline"
            colorScheme="red"
            marginLeft={4}
            onClick={onCancelScheduledMessage}
          >
            <FormattedMessage id="timeline.message-scheduled-cancel" defaultMessage="Cancel" />
          </Button>
        ) : null}
      </Flex>
    </TimelineItem>
  );
}

TimelineMessageScheduledEvent.fragments = {
  MessageScheduledEvent: gql`
    fragment TimelineMessageScheduledEvent_MessageScheduledEvent on MessageScheduledEvent {
      message {
        sender {
          ...UserReference_User
        }
        status
        scheduledAt
        emailSubject
        access {
          delegateGranter {
            ...UserReference_User
          }
          contact {
            ...ContactReference_Contact
          }
        }
        ...SentPetitionMessageDialog_PetitionMessage
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
    ${SentPetitionMessageDialog.fragments.PetitionMessage}
  `,
};
