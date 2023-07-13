import { gql } from "@apollo/client";
import { ThumbUpIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionClosedNotifiedEventProps {
  userId: string;
  event: TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEventFragment;
}

export function TimelinePetitionClosedNotifiedEvent({
  event,
  userId,
}: TimelinePetitionClosedNotifiedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={ThumbUpIcon} color="white" backgroundColor="blue.500" />}
    >
      {event.access.delegateGranter ? (
        <FormattedMessage
          id="timeline.petition-correct-notified-description-delegated"
          defaultMessage="{userIsYou, select, true {You} other {{user}}} as {senderIsYou, select, true {you} other {{sender}}} notified {contact} that the parallel is correct {timeAgo}"
          values={{
            userIsYou: userId === event.user?.id,
            user: <UserReference user={event.user} />,
            senderIsYou: userId === event.access.granter?.id,
            sender: <UserReference user={event.access.granter} />,
            contact: <ContactReference contact={event.access.contact} />,
            timeAgo: (
              <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
            ),
          }}
        />
      ) : (
        <FormattedMessage
          id="timeline.petition-correct-notified-description"
          defaultMessage="{userIsYou, select, true {You} other {{user}}} notified {contact} that the parallel is correct {timeAgo}"
          values={{
            userIsYou: userId === event.user?.id,
            user: <UserReference user={event.user} />,
            contact: <ContactReference contact={event.access.contact} />,
            timeAgo: (
              <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
            ),
          }}
        />
      )}
    </TimelineItem>
  );
}

TimelinePetitionClosedNotifiedEvent.fragments = {
  PetitionClosedNotifiedEvent: gql`
    fragment TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEvent on PetitionClosedNotifiedEvent {
      user {
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
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
  `,
};
