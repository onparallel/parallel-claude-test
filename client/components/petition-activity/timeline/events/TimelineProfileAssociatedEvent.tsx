import { gql } from "@apollo/client";
import { ArrowDiagonalRightIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { ProfileLink } from "@parallel/components/common/ProfileLink";
import { TimelineProfileAssociatedEvent_ProfileAssociatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineProfileAssociatedEventProps {
  event: TimelineProfileAssociatedEvent_ProfileAssociatedEventFragment;
}

export function TimelineProfileAssociatedEvent({ event }: TimelineProfileAssociatedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={ArrowDiagonalRightIcon} color="white" backgroundColor="blue.500" />}
    >
      <FormattedMessage
        id="timeline.profile-associated-description"
        defaultMessage="{userIsYou, select, true {You} other {{user}}} associated the parallel with {profileName} {timeAgo}"
        values={{
          userIsYou: false,
          user: <UserReference user={event.user} />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
          profileName: <ProfileLink profile={event.profile} />,
        }}
      />
    </TimelineItem>
  );
}

TimelineProfileAssociatedEvent.fragments = {
  ProfileAssociatedEvent: gql`
    fragment TimelineProfileAssociatedEvent_ProfileAssociatedEvent on ProfileAssociatedEvent {
      user {
        ...UserReference_User
      }
      profile {
        ...ProfileLink_Profile
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${ProfileLink.fragments.Profile}
  `,
};
