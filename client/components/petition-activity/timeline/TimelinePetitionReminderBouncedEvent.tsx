import { gql } from "@apollo/client";
import { EmailXIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionReminderBouncedEvent_PetitionReminderBouncedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

type TimelinePetitionReminderBouncedEventProps = {
  event: TimelinePetitionReminderBouncedEvent_PetitionReminderBouncedEventFragment;
};

export function TimelinePetitionReminderBouncedEvent({
  event,
}: TimelinePetitionReminderBouncedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<EmailXIcon />} color="white" backgroundColor="red.500" />}
    >
      <FormattedMessage
        id="timeline.petition-reminder-bounced-description"
        defaultMessage="We could not send a reminder to contact {contactName} {timeAgo}"
        values={{
          contactName: <ContactReference contact={event.reminder.access.contact} />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelinePetitionReminderBouncedEvent.fragments = {
  PetitionReminderBouncedEvent: gql`
    fragment TimelinePetitionReminderBouncedEvent_PetitionReminderBouncedEvent on PetitionReminderBouncedEvent {
      reminder {
        access {
          contact {
            ...ContactReference_Contact
          }
        }
      }
      createdAt
    }
    ${ContactReference.fragments.Contact}
  `,
};
