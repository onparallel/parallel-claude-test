import { Link, Text } from "@chakra-ui/core";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { TimelineMessageCancelledEvent_MessageCancelledEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { gql } from "apollo-boost";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineMessageCancelledEventProps = {
  userId: string;
  event: TimelineMessageCancelledEvent_MessageCancelledEventFragment;
};

export function TimelineMessageCancelledEvent({
  event: { message, user, createdAt },
  userId,
}: TimelineMessageCancelledEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon="forbidden"
          color="white"
          backgroundColor="red.500"
        />
      }
    >
      <FormattedMessage
        id="timeline.message-cancelled-description"
        defaultMessage="{same, select, true {You} other {<b>{user}</b>}} cancelled a scheduled a message {subject, select, null {without subject} other {with subject <b>{subject}</b>}} to {contact} {timeAgo}"
        values={{
          same: userId === user!.id,
          b: (...chunks: any[]) => <Text as="strong">{chunks}</Text>,
          user: user!.fullName,
          subject: message.emailSubject,
          contact: message.access.contact ? (
            <ContactLink contact={message.access.contact} />
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
    </TimelineItem>
  );
}

TimelineMessageCancelledEvent.fragments = {
  MessageCancelledEvent: gql`
    fragment TimelineMessageCancelledEvent_MessageCancelledEvent on MessageCancelledEvent {
      message {
        status
        scheduledAt
        emailSubject
        access {
          contact {
            ...ContactLink_Contact
          }
        }
      }
      user {
        id
        fullName
      }
      createdAt
    }
    ${ContactLink.fragments.Contact}
  `,
};
