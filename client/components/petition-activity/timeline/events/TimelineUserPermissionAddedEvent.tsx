import { gql } from "@apollo/client";
import { UserArrowIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { PetitionPermissionTypeText } from "@parallel/components/petition-common/PetitionPermissionType";
import { TimelineUserPermissionAddedEvent_UserPermissionAddedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineUserPermissionAddedEventProps {
  event: TimelineUserPermissionAddedEvent_UserPermissionAddedEventFragment;
}

export function TimelineUserPermissionAddedEvent({ event }: TimelineUserPermissionAddedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={UserArrowIcon} color="white" backgroundColor="primary.500" />}
    >
      <FormattedMessage
        id="component.timeline-user-permission-added-event.description"
        defaultMessage="{user} shared this parallel with {other} as {permissionType} {timeAgo}"
        values={{
          user: <UserReference user={event.user} />,
          other: <UserReference user={event.permissionUser} />,
          permissionType: (
            <PetitionPermissionTypeText
              as="em"
              type={event.permissionType}
              textTransform="lowercase"
            />
          ),
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelineUserPermissionAddedEvent.fragments = {
  UserPermissionAddedEvent: gql`
    fragment TimelineUserPermissionAddedEvent_UserPermissionAddedEvent on UserPermissionAddedEvent {
      user {
        ...UserReference_User
      }
      permissionUser {
        ...UserReference_User
      }
      permissionType
      createdAt
    }
    ${UserReference.fragments.User}
  `,
};
