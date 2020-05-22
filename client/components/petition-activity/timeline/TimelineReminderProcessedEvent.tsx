import { TimelineReminderProcessedEvent_ReminderProcessedEventFragment } from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { Text, Link } from "@chakra-ui/core";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { DateTime } from "@parallel/components/common/DateTime";
import { FORMATS } from "@parallel/utils/dates";

export type TimelineReminderProcessedEventProps = {
  userId: string;
  event: TimelineReminderProcessedEvent_ReminderProcessedEventFragment;
};

export function TimelineReminderProcessedEvent({
  event: { reminder, createdAt },
  userId,
}: TimelineReminderProcessedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon icon="bell" color="black" backgroundColor="gray.200" />
      }
    >
      {reminder.type === "MANUAL" ? (
        <FormattedMessage
          id="timeline.reminder-processed-description-manual"
          defaultMessage="{same, select, true {You} other {<b>{user}</b>}} sent a manual reminder to {contact} {timeAgo}"
          values={{
            same: userId === reminder.sender!.id,
            b: (...chunks: any[]) => <Text as="strong">{chunks}</Text>,
            user: reminder.sender!.fullName,
            contact: reminder.access.contact ? (
              <ContactLink contact={reminder.access.contact} />
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
          id="timeline.reminder-processed-description-automatic"
          defaultMessage="An automatic reminder was sent to {contact} {timeAgo}"
          values={{
            same: userId === reminder.sender!.id,
            b: (...chunks: any[]) => <Text as="strong">{chunks}</Text>,
            user: reminder.sender!.fullName,
            contact: reminder.access.contact ? (
              <ContactLink contact={reminder.access.contact} />
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
    </TimelineItem>
  );
}

TimelineReminderProcessedEvent.fragments = {
  ReminderProcessedEvent: gql`
    fragment TimelineReminderProcessedEvent_ReminderProcessedEvent on ReminderProcessedEvent {
      reminder {
        type
        sender {
          id
          fullName
        }
        access {
          contact {
            ...ContactLink_Contact
          }
        }
      }
      createdAt
    }
    ${ContactLink.fragments.Contact}
  `,
};
