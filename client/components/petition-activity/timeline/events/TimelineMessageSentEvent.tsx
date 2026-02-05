import { gql } from "@apollo/client";
import { Box, Button, Flex } from "@chakra-ui/react";
import { EmailSentIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { EmailEventsIndicator } from "@parallel/components/petition-activity/EmailEventsIndicator";
import { TimelineMessageSentEvent_MessageSentEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { useSentPetitionMessageDialog } from "../../dialogs/SentPetitionMessageDialog";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";
import { Text } from "@parallel/components/ui";

export interface TimelineMessageSentEventProps {
  event: TimelineMessageSentEvent_MessageSentEventFragment;
}

export function TimelineMessageSentEvent({
  event: { message, createdAt },
}: TimelineMessageSentEventProps) {
  const showSentPetitionMessage = useSentPetitionMessageDialog();
  async function handleSeeMessageClick() {
    try {
      await showSentPetitionMessage({ message });
    } catch {}
  }
  return (
    <TimelineItem
      icon={<TimelineIcon icon={EmailSentIcon} color="black" backgroundColor="gray.200" />}
    >
      <Flex alignItems="center">
        <Box>
          {message.scheduledAt ? (
            message.access.delegateGranter ? (
              <FormattedMessage
                id="component.timeline-message-sent-event.description-scheduled-delegated"
                defaultMessage="A message scheduled by {delegate} as {sender} {subject, select, null {without subject} other {with subject <b>{subject}</b>}} was sent to {contact} {timeAgo}"
                values={{
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
                id="component.timeline-message-sent-event.description-scheduled"
                defaultMessage="A message scheduled by {sender} {subject, select, null {without subject} other {with subject <b>{subject}</b>}} was sent to {contact} {timeAgo}"
                values={{
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
              id="component.timeline-message-sent-event.description-manual-delegated"
              defaultMessage="{delegate} sent a message as {sender} {subject, select, null {without subject} other {with subject <b>{subject}</b>}} to {contact} {timeAgo}"
              values={{
                delegate: <UserReference user={message.access.delegateGranter} />,
                sender: <UserReference user={message.sender} />,
                subject: message.isAnonymized ? (
                  <Text as="span" textStyle="hint" fontWeight="normal">
                    <FormattedMessage
                      id="component.timeline-message-sent-event.subject-unavailable"
                      defaultMessage="Subject unavailable"
                    />
                  </Text>
                ) : (
                  message.emailSubject
                ),

                contact: <ContactReference contact={message.access.contact} />,
                timeAgo: (
                  <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          ) : (
            <FormattedMessage
              id="component.timeline-message-sent-event.description-manual"
              defaultMessage="{sender} sent a message {subject, select, null {without subject} other {with subject <b>{subject}</b>}} to {contact} {timeAgo}"
              values={{
                sender: <UserReference user={message.sender} />,
                subject: message.isAnonymized ? (
                  <Text as="span" textStyle="hint" fontWeight="normal">
                    <FormattedMessage
                      id="component.timeline-message-sent-event.subject-unavailable"
                      defaultMessage="Subject unavailable"
                    />
                  </Text>
                ) : (
                  message.emailSubject
                ),

                contact: <ContactReference contact={message.access.contact} />,
                timeAgo: (
                  <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          )}

          <EmailEventsIndicator
            openedAt={message.openedAt}
            deliveredAt={message.deliveredAt}
            bouncedAt={message.bouncedAt}
            marginStart={2}
          />
        </Box>
        {message.emailBody ? (
          <Button
            onClick={handleSeeMessageClick}
            size="sm"
            variant="outline"
            marginStart={4}
            background="white"
          >
            <FormattedMessage id="generic.see-message" defaultMessage="See message" />
          </Button>
        ) : null}
      </Flex>
    </TimelineItem>
  );
}

const _fragments = {
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
        isAnonymized
        openedAt
        deliveredAt
        bouncedAt
        ...SentPetitionMessageDialog_PetitionMessage
      }
      createdAt
    }
  `,
};
