import { gql } from "@apollo/client";
import { CloseIconSmall } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { TimelineProfileDisassociatedEvent_ProfileDisassociatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";
import { UserOrContactReference } from "../../UserOrContactReference";

export interface TimelineProfileDisassociatedEventProps {
  userId: string;
  event: TimelineProfileDisassociatedEvent_ProfileDisassociatedEventFragment;
}

export function TimelineProfileDisassociatedEvent({
  event,
  userId,
}: TimelineProfileDisassociatedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={CloseIconSmall} color="white" backgroundColor="red.500" />}
    >
      <FormattedMessage
        id="component.timeline-profile-disassociated-event.description"
        defaultMessage="{authorIsYou, select, true {You} other {{author}}} removed the association with {profileName} {timeAgo}"
        values={{
          authorIsYou:
            event.disassociatedBy?.__typename === "User" && event.disassociatedBy.id === userId,
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

TimelineProfileDisassociatedEvent.fragments = {
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
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
    ${UserReference.fragments.User}
    ${ProfileReference.fragments.Profile}
  `,
};
