import { gql } from "@apollo/client";
import { CloseIconSmall } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { TimelineProfileDisassociatedEvent_ProfileDisassociatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserOrContactReference } from "../../../common/UserOrContactReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineProfileDisassociatedEventProps {
  event: TimelineProfileDisassociatedEvent_ProfileDisassociatedEventFragment;
}

export function TimelineProfileDisassociatedEvent({
  event,
}: TimelineProfileDisassociatedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={CloseIconSmall} color="white" backgroundColor="red.500" />}
    >
      <FormattedMessage
        id="component.timeline-profile-disassociated-event.description"
        defaultMessage="{author} removed the association with {profileName} {timeAgo}"
        values={{
          author: <UserOrContactReference userOrAccess={event.disassociatedBy} />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
          profileName: <ProfileReference profile={event.profile} asLink />,
        }}
      />
    </TimelineItem>
  );
}

const _fragments = {
  ProfileDisassociatedEvent: gql`
    fragment TimelineProfileDisassociatedEvent_ProfileDisassociatedEvent on ProfileDisassociatedEvent {
      disassociatedBy {
        ...UserOrContactReference_UserOrPetitionAccess
      }
      profile {
        ...ProfileReference_Profile
      }
      createdAt
    }
  `,
};
