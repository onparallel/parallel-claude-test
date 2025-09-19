import { gql } from "@apollo/client";
import { DeleteIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionScheduledForDeletionEvent_PetitionScheduledForDeletionEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionScheduledForDeletionEventProps {
  event: TimelinePetitionScheduledForDeletionEvent_PetitionScheduledForDeletionEventFragment;
}

export function TimelinePetitionScheduledForDeletionEvent({
  event,
}: TimelinePetitionScheduledForDeletionEventProps) {
  return (
    <TimelineItem icon={<TimelineIcon icon={DeleteIcon} color="white" backgroundColor="red.500" />}>
      <FormattedMessage
        id="component.timeline-petition-scheduled-for-deletion-event.description"
        defaultMessage="{user} scheduled this parallel for deletion {timeAgo}"
        values={{
          user: <UserReference user={event.user} />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelinePetitionScheduledForDeletionEvent.fragments = {
  PetitionScheduledForDeletionEvent: gql`
    fragment TimelinePetitionScheduledForDeletionEvent_PetitionScheduledForDeletionEvent on PetitionScheduledForDeletionEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
    ${UserReference.fragments.User}
  `,
};
