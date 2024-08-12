import { gql } from "@apollo/client";
import { ForbiddenIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineMessageCancelledEvent_MessageCancelledEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineMessageCancelledEventProps {
  event: TimelineMessageCancelledEvent_MessageCancelledEventFragment;
}

export function TimelineMessageCancelledEvent({
  event: { message, user, createdAt, reason },
}: TimelineMessageCancelledEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={ForbiddenIcon} color="white" backgroundColor="red.500" />}
    >
      {reason === "CANCELLED_BY_USER" ? (
        <FormattedMessage
          id="component.timeline-message-cancelled-event.description-manual"
          defaultMessage="{user} cancelled a scheduled a message {subject, select, null {without subject} other {with subject <b>{subject}</b>}} to {contact} {timeAgo}"
          values={{
            user: <UserReference user={user} />,
            subject: message.emailSubject,
            contact: <ContactReference contact={message.access.contact} />,
            timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
          }}
        />
      ) : (
        <FormattedMessage
          id="component.timeline-message-cancelled-event.description-bounced"
          defaultMessage="We cancelled a scheduled a message {subject, select, null {without subject} other {with subject <b>{subject}</b>}} to {contact} because an email was bounced {timeAgo}"
          values={{
            subject: message.emailSubject,
            contact: <ContactReference contact={message.access.contact} />,
            timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
          }}
        />
      )}
    </TimelineItem>
  );
}

TimelineMessageCancelledEvent.fragments = {
  MessageCancelledEvent: gql`
    fragment TimelineMessageCancelledEvent_MessageCancelledEvent on MessageCancelledEvent {
      reason
      message {
        status
        scheduledAt
        emailSubject
        access {
          contact {
            ...ContactReference_Contact
          }
        }
      }
      user {
        ...UserReference_User
      }
      createdAt
    }
    ${ContactReference.fragments.Contact}
    ${UserReference.fragments.User}
  `,
};
