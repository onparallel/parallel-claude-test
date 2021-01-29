import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { ForbiddenIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineMessageCancelledEvent_MessageCancelledEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
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
          icon={<ForbiddenIcon />}
          color="white"
          backgroundColor="red.500"
        />
      }
    >
      <FormattedMessage
        id="timeline.message-cancelled-description"
        defaultMessage="{same, select, true {You} other {{user}}} cancelled a scheduled a message {subject, select, null {without subject} other {with subject <b>{subject}</b>}} to {contact} {timeAgo}"
        values={{
          same: userId === user?.id,
          b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
          user: <UserReference user={user} />,
          subject: message.emailSubject,
          contact: <ContactLink contact={message.access.contact} />,
          timeAgo: (
            <DateTime
              value={createdAt}
              format={FORMATS.LLL}
              useRelativeTime="always"
            />
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
        ...UserReference_User
      }
      createdAt
    }
    ${ContactLink.fragments.Contact}
    ${UserReference.fragments.User}
  `,
};
