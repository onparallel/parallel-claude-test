import { gql } from "@apollo/client";
import { CloseIconSmall } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { ProfileLink } from "@parallel/components/common/ProfileLink";
import { TimelineProfileDeassociatedEvent_ProfileDeassociatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export type TimelineProfileDeassociatedEventProps = {
  event: TimelineProfileDeassociatedEvent_ProfileDeassociatedEventFragment;
};

export function TimelineProfileDeassociatedEvent({ event }: TimelineProfileDeassociatedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={CloseIconSmall} color="white" backgroundColor="red.500" />}
    >
      <FormattedMessage
        id="timeline.profile-deassociated-description"
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

TimelineProfileDeassociatedEvent.fragments = {
  ProfileDeassociatedEvent: gql`
    fragment TimelineProfileDeassociatedEvent_ProfileDeassociatedEvent on ProfileDeassociatedEvent {
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
