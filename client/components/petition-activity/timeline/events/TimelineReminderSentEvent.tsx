import { gql } from "@apollo/client";

import { Box, Button, Flex } from "@parallel/components/ui";
import { BellIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineReminderSentEvent_ReminderSentEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { useSentReminderMessageDialog } from "../../dialogs/SentReminderMessageDialog";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineReminderSentEventProps {
  event: TimelineReminderSentEvent_ReminderSentEventFragment;
}

export function TimelineReminderSentEvent({
  event: { reminder, createdAt },
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
                id="component.timeline-reminder-sent-event.description-manual-delegated"
                defaultMessage="{user} sent a manual reminder as {sender} to {contact} {timeAgo}"
                values={{
                  user: <UserReference user={reminder.sender} />,
                  sender: <UserReference user={reminder.access.granter} />,
                  contact: <ContactReference contact={reminder.access.contact} />,
                  timeAgo: (
                    <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                  ),
                }}
              />
            ) : (
              <FormattedMessage
                id="component.timeline-reminder-sent-event.description-manual"
                defaultMessage="{user} sent a manual reminder to {contact} {timeAgo}"
                values={{
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
              id="component.timeline-reminder-sent-event.description-automatic-delegated"
              defaultMessage="An automatic reminder as {sender} was sent to {contact} {timeAgo}"
              values={{
                sender: <UserReference user={reminder.access.granter} />,
                contact: <ContactReference contact={reminder.access.contact} />,
                timeAgo: (
                  <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          ) : (
            <FormattedMessage
              id="component.timeline-reminder-sent-event.description-automatic"
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
  `,
};
