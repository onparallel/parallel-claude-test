import { gql } from "@apollo/client";
import { Box, Button, Flex } from "@chakra-ui/react";
import { BellIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineReminderSentEvent_ReminderSentEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import {
  SentReminderMessageDialog,
  useSentReminderMessageDialog,
} from "../../dialogs/SentReminderMessageDialog";
import { UserReference } from "../../UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineReminderSentEventProps {
  userId: string;
  event: TimelineReminderSentEvent_ReminderSentEventFragment;
}

export function TimelineReminderSentEvent({
  event: { reminder, createdAt },
  userId,
}: TimelineReminderSentEventProps) {
  const showSentReminderMessage = useSentReminderMessageDialog();
  async function handleSeeMessageClick() {
    try {
      await showSentReminderMessage({ reminder });
    } catch {}
  }

  return (
    <TimelineItem icon={<TimelineIcon icon={BellIcon} color="black" backgroundColor="gray.200" />}>
      <Flex align="center">
        <Box>
          {reminder.type === "MANUAL" ? (
            reminder.access.delegateGranter ? (
              <FormattedMessage
                id="timeline.reminder-sent-description-manual-delegated"
                defaultMessage="{userIsYou, select, true {You} other {{user}}} sent a manual reminder as {senderIsYou, select, true {you} other {{sender}}} to {contact} {timeAgo}"
                values={{
                  userIsYou: userId === reminder.sender?.id,
                  user: <UserReference user={reminder.sender} />,
                  senderIsYou: userId === reminder.access.granter?.id,
                  sender: <UserReference user={reminder.access.granter} />,
                  contact: <ContactReference contact={reminder.access.contact} />,
                  timeAgo: (
                    <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                  ),
                }}
              />
            ) : (
              <FormattedMessage
                id="timeline.reminder-sent-description-manual"
                defaultMessage="{userIsYou, select, true {You} other {{user}}} sent a manual reminder to {contact} {timeAgo}"
                values={{
                  userIsYou: userId === reminder.sender?.id,
                  user: <UserReference user={reminder.sender} />,
                  contact: <ContactReference contact={reminder.access.contact} />,
                  timeAgo: (
                    <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                  ),
                }}
              />
            )
          ) : reminder.access.delegateGranter ? (
            <FormattedMessage
              id="timeline.reminder-sent-description-automatic-delegated"
              defaultMessage="An automatic reminder as {senderIsYou, select, true {you} other {{sender}}} was sent to {contact} {timeAgo}"
              values={{
                senderIsYou: userId === reminder.access.granter?.id,
                sender: <UserReference user={reminder.access.granter} />,
                contact: <ContactReference contact={reminder.access.contact} />,
                timeAgo: (
                  <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          ) : (
            <FormattedMessage
              id="timeline.reminder-sent-description-automatic"
              defaultMessage="An automatic reminder was sent to {contact} {timeAgo}"
              values={{
                contact: <ContactReference contact={reminder.access.contact} />,
                timeAgo: (
                  <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          )}
        </Box>
        {reminder.emailBody ? (
          <Button
            onClick={handleSeeMessageClick}
            size="sm"
            variant="outline"
            marginLeft={4}
            background="white"
          >
            <FormattedMessage id="timeline.message-sent-see-message" defaultMessage="See message" />
          </Button>
        ) : null}
      </Flex>
    </TimelineItem>
  );
}

TimelineReminderSentEvent.fragments = {
  ReminderSentEvent: gql`
    fragment TimelineReminderSentEvent_ReminderSentEvent on ReminderSentEvent {
      reminder {
        type
        sender {
          ...UserReference_User
        }
        access {
          delegateGranter {
            id
          }
          granter {
            ...UserReference_User
          }
          contact {
            ...ContactReference_Contact
          }
        }
        ...SentReminderMessageDialog_PetitionReminder
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
    ${SentReminderMessageDialog.fragments.PetitionReminder}
  `,
};
