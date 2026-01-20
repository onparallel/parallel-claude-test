import { gql } from "@apollo/client";
import { ShinyIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionCreatedEvent_PetitionCreatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionCreatedEventProps {
  event: TimelinePetitionCreatedEvent_PetitionCreatedEventFragment;
}

export function TimelinePetitionCreatedEvent({
  event: { user, createdAt },
}: TimelinePetitionCreatedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={ShinyIcon} color="white" backgroundColor="primary.500" />}
      paddingBottom={0}
    >
      <FormattedMessage
        id="component.timeline-petition-created-event.description"
        defaultMessage="{user} created this parallel {timeAgo}"
        values={{
          user: <UserReference user={user} />,
          timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
        }}
      />
    </TimelineItem>
  );
}

const _fragments = {
  PetitionCreatedEvent: gql`
    fragment TimelinePetitionCreatedEvent_PetitionCreatedEvent on PetitionCreatedEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
  `,
};
