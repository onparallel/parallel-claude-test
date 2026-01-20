import { gql } from "@apollo/client";
import { UndoIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionRecoveredFromDeletionEvent_PetitionRecoveredFromDeletionEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionRecoveredFromDeletionEventProps {
  event: TimelinePetitionRecoveredFromDeletionEvent_PetitionRecoveredFromDeletionEventFragment;
}

export function TimelinePetitionRecoveredFromDeletionEvent({
  event,
}: TimelinePetitionRecoveredFromDeletionEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={UndoIcon} color="white" backgroundColor="primary.500" />}
    >
      <FormattedMessage
        id="component.timeline-petition-recovered-from-deletion-event.description"
        defaultMessage="{user} recovered this parallel from deletion {timeAgo}"
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

const _fragments = {
  PetitionRecoveredFromDeletionEvent: gql`
    fragment TimelinePetitionRecoveredFromDeletionEvent_PetitionRecoveredFromDeletionEvent on PetitionRecoveredFromDeletionEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
  `,
};
