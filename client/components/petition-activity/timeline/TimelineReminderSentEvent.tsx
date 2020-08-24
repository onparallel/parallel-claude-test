import { gql } from "@apollo/client";
import { Link, Text } from "@chakra-ui/core";
import { BellIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { TimelineReminderSentEvent_ReminderSentEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineReminderSentEventProps = {
  userId: string;
  event: TimelineReminderSentEvent_ReminderSentEventFragment;
};

export function TimelineReminderSentEvent({
  event: { reminder, createdAt },
  userId,
}: TimelineReminderSentEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<BellIcon />}
          color="black"
          backgroundColor="gray.200"
        />
      }
    >
      {reminder.type === "MANUAL" ? (
        <FormattedMessage
          id="timeline.reminder-sent-description-manual"
          defaultMessage="{same, select, true {You} other {{user}}} sent a manual reminder to {contact} {timeAgo}"
          values={{
            same: userId === reminder.sender?.id,
            b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
            user: <UserReference user={reminder.sender} />,
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
          id="timeline.reminder-sent-description-automatic"
          defaultMessage="An automatic reminder was sent to {contact} {timeAgo}"
          values={{
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

TimelineReminderSentEvent.fragments = {
  ReminderSentEvent: gql`
    fragment TimelineReminderSentEvent_ReminderSentEvent on ReminderSentEvent {
      reminder {
        type
        sender {
          ...UserReference_User
        }
        access {
          contact {
            ...ContactLink_Contact
          }
        }
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactLink.fragments.Contact}
  `,
};
