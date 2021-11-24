import { gql } from "@apollo/client";
import { Box, Button, Flex } from "@chakra-ui/react";
import { EmailSentIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { MessageEventsIndicator } from "@parallel/components/petition-activity/MessageEventsIndicator";
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
            <FormattedMessage
              id="timeline.message-sent-description-scheduled"
              defaultMessage="A message scheduled by {same, select, true {you} other {{user}}} {subject, select, null {without subject} other {with subject <b>{subject}</b>}} was sent to {contact} {timeAgo}"
              values={{
                same: userId === message.sender?.id,
                user: <UserReference user={message.sender} />,
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
              defaultMessage="{same, select, true {You} other {{user}}} sent a message {subject, select, null {without subject} other {with subject <b>{subject}</b>}} to {contact} {timeAgo}"
              values={{
                same: userId === message.sender!.id,
                user: message.sender!.fullName,
                subject: message.emailSubject,
                contact: <ContactReference contact={message.access.contact} />,
                timeAgo: (
                  <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          )}
          <MessageEventsIndicator message={message} marginLeft={2} />
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
          contact {
            ...ContactReference_Contact
          }
        }
        ...MessageEventsIndicator_PetitionMessage
        ...SentPetitionMessageDialog_PetitionMessage
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
    ${MessageEventsIndicator.fragments.PetitionMessage}
    ${SentPetitionMessageDialog.fragments.PetitionMessage}
  `,
};
