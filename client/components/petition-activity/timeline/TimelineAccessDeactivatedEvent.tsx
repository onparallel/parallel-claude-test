import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { UserXIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineAccessDeactivatedEventProps = {
  userId: string;
  event: TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragment;
};

export function TimelineAccessDeactivatedEvent({
  event,
  userId,
}: TimelineAccessDeactivatedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<UserXIcon />}
          color="white"
          backgroundColor="red.500"
        />
      }
    >
      <FormattedMessage
        id="timeline.access-deactivated-description"
        defaultMessage="{same, select, true {You} other {{user}}} removed access to {contact} {timeAgo}"
        values={{
          same: userId === event.user?.id,
          b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
          user: <UserReference user={event.user} />,
          contact: <ContactLink contact={event.access.contact} />,
          timeAgo: (
            <DateTime
              value={event.createdAt}
              format={FORMATS.LLL}
              useRelativeTime="always"
            />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelineAccessDeactivatedEvent.fragments = {
  AccessDeactivatedEvent: gql`
    fragment TimelineAccessDeactivatedEvent_AccessDeactivatedEvent on AccessDeactivatedEvent {
      user {
        ...UserReference_User
      }
      access {
        contact {
          ...ContactLink_Contact
        }
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactLink.fragments.Contact}
  `,
};
