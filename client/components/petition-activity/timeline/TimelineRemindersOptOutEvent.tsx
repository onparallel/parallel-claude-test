import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { BellOffIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineRemindersOptOutEvent_RemindersOptOutEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import {
  ReminderOptOutReason,
  useReminderOptOutReasons,
} from "@parallel/utils/useReminderOptOutReasons";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineRemindersOptOutEventProps = {
  event: TimelineRemindersOptOutEvent_RemindersOptOutEventFragment;
};

export function TimelineRemindersOptOutEvent({
  event,
}: TimelineRemindersOptOutEventProps) {
  const answers = useReminderOptOutReasons();
  const { other, access, createdAt } = event;
  const reason = event.reason as ReminderOptOutReason;

  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<BellOffIcon />}
          color="white"
          backgroundColor="red.600"
        />
      }
    >
      <Text as="div">
        <FormattedMessage
          id="timeline.reminders-opt-out-description"
          defaultMessage="{contact} has opted out from receiving reminders for this petition {timeAgo}"
          values={{
            contact: <ContactLink contact={access.contact} />,
            timeAgo: (
              <DateTime
                value={createdAt}
                format={FORMATS.LLL}
                useRelativeTime="always"
              />
            ),
          }}
        />
      </Text>
      <Text as="cite" paddingTop={1}>
        {reason === "OTHER" ? `${answers[reason]}: ${other}` : answers[reason]}
      </Text>
    </TimelineItem>
  );
}

TimelineRemindersOptOutEvent.fragments = {
  RemindersOptOutEvent: gql`
    fragment TimelineRemindersOptOutEvent_RemindersOptOutEvent on RemindersOptOutEvent {
      access {
        contact {
          ...ContactLink_Contact
        }
      }
      createdAt
      reason
      other
    }
    ${ContactLink.fragments.Contact}
  `,
};
