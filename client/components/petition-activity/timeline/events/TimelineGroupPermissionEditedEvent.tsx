import { gql } from "@apollo/client";
import { UserGroupArrowIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { PetitionPermissionTypeText } from "@parallel/components/petition-common/PetitionPermissionType";
import { TimelineGroupPermissionEditedEvent_GroupPermissionEditedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserGroupReference } from "../../../common/UserGroupReference";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineGroupPermissionEditedEventProps {
  event: TimelineGroupPermissionEditedEvent_GroupPermissionEditedEventFragment;
}

export function TimelineGroupPermissionEditedEvent({
  event,
}: TimelineGroupPermissionEditedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={UserGroupArrowIcon} color="white" backgroundColor="yellow.500" />}
    >
      <FormattedMessage
        id="component.timeline-group-permission-edited-event.description"
        defaultMessage="{user} updated {groupName}'s permission to {permissionType} {timeAgo}"
        values={{
          user: <UserReference user={event.user} />,
          groupName: <UserGroupReference userGroup={event.permissionGroup} as="strong" />,
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
  GroupPermissionEditedEvent: gql`
    fragment TimelineGroupPermissionEditedEvent_GroupPermissionEditedEvent on GroupPermissionEditedEvent {
      user {
        ...UserReference_User
      }
      permissionGroup {
        ...UserGroupReference_UserGroup
      }
      permissionType
      createdAt
    }
  `,
};
