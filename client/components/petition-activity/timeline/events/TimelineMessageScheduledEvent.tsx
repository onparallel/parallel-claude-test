import { gql, useMutation } from "@apollo/client";
import { Box, Button, Flex } from "@chakra-ui/react";
import { TimeIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import {
  PetitionActivity_petitionDocument,
  TimelineMessageScheduledEvent_MessageScheduledEventFragment,
  TimelineMessageScheduledEvent_cancelScheduledMessageDocument,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import {
  SentPetitionMessageDialog,
  useSentPetitionMessageDialog,
} from "../../dialogs/SentPetitionMessageDialog";

import { getOperationName } from "@apollo/client/utilities";
import { useCallback } from "react";
import { UserReference } from "../../UserReference";
import { useConfirmCancelScheduledMessageDialog } from "../../dialogs/ConfirmCancelScheduledMessageDialog";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineMessageScheduledEventProps {
  userId: string;
  event: TimelineMessageScheduledEvent_MessageScheduledEventFragment;
}

export function TimelineMessageScheduledEvent({
  event: { message, petition, createdAt },
  userId,
}: TimelineMessageScheduledEventProps) {
  const showSentPetitionMessage = useSentPetitionMessageDialog();
  async function handleSeeMessageClick() {
    try {
      await showSentPetitionMessage({ message });
    } catch {}
  }
  const confirmCancelScheduledMessage = useConfirmCancelScheduledMessageDialog();
  const [cancelScheduledMessage] = useMutation(
    TimelineMessageScheduledEvent_cancelScheduledMessageDocument,
  );
  const handleCancelScheduledMessage = useCallback(async () => {
    try {
      await confirmCancelScheduledMessage();
    } catch {
      return;
    }
    await cancelScheduledMessage({
      variables: { petitionId: petition!.id, messageId: message.id },
      refetchQueries: [getOperationName(PetitionActivity_petitionDocument)!],
    });
  }, []);
  return (
    <TimelineItem icon={<TimelineIcon icon={TimeIcon} color="black" backgroundColor="gray.200" />}>
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
          <Button
            onClick={handleSeeMessageClick}
            size="sm"
            variant="outline"
            marginStart={4}
            background="white"
          >
            <FormattedMessage id="timeline.message-sent-see-message" defaultMessage="See message" />
          </Button>
        ) : null}
        {message.status === "SCHEDULED" ? (
          <Button
            size="sm"
            variant="outline"
            colorScheme="red"
            marginStart={4}
            onClick={handleCancelScheduledMessage}
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
      petition {
        id
      }
      message {
        id
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

const _mutations = [
  gql`
    mutation TimelineMessageScheduledEvent_cancelScheduledMessage(
      $petitionId: GID!
      $messageId: GID!
    ) {
      cancelScheduledMessage(petitionId: $petitionId, messageId: $messageId) {
        id
        status
      }
    }
  `,
];
