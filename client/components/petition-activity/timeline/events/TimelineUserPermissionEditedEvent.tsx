import { gql } from "@apollo/client";
import { UserArrowIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { PetitionPermissionTypeText } from "@parallel/components/petition-common/PetitionPermissionType";
import { TimelineUserPermissionEditedEvent_UserPermissionEditedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineUserPermissionEditedEventProps {
  event: TimelineUserPermissionEditedEvent_UserPermissionEditedEventFragment;
}

export function TimelineUserPermissionEditedEvent({
  event,
}: TimelineUserPermissionEditedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={UserArrowIcon} color="white" backgroundColor="yellow.500" />}
    >
      <FormattedMessage
        id="component.timeline-user-permission-edited-event.description"
        defaultMessage="{user} updated {other}'s permission to {permissionType} {timeAgo}"
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

const _fragments = {
  UserPermissionEditedEvent: gql`
    fragment TimelineUserPermissionEditedEvent_UserPermissionEditedEvent on UserPermissionEditedEvent {
      user {
        ...UserReference_User
      }
      permissionUser {
        ...UserReference_User
      }
      permissionType
      createdAt
    }
  `,
};
