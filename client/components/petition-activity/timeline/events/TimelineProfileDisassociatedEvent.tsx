import { gql } from "@apollo/client";
import { CloseIconSmall } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { ProfileLink } from "@parallel/components/common/ProfileLink";
import { TimelineProfileDisassociatedEvent_ProfileDisassociatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export type TimelineProfileDisassociatedEventProps = {
  event: TimelineProfileDisassociatedEvent_ProfileDisassociatedEventFragment;
};

export function TimelineProfileDisassociatedEvent({
  event,
}: TimelineProfileDisassociatedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={CloseIconSmall} color="white" backgroundColor="red.500" />}
    >
      <FormattedMessage
        id="timeline.profile-disassociated-description"
        defaultMessage="{userIsYou, select, true {You} other {{user}}} removed the association with {profileName} {timeAgo}"
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

TimelineProfileDisassociatedEvent.fragments = {
  ProfileDisassociatedEvent: gql`
    fragment TimelineProfileDisassociatedEvent_ProfileDisassociatedEvent on ProfileDisassociatedEvent {
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
