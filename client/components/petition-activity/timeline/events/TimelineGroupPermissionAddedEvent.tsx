import { gql } from "@apollo/client";
import { UserGroupArrowIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { PetitionPermissionTypeText } from "@parallel/components/petition-common/PetitionPermissionType";
import { TimelineGroupPermissionAddedEvent_GroupPermissionAddedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserGroupReference } from "../../../common/UserGroupReference";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineGroupPermissionAddedEventProps {
  event: TimelineGroupPermissionAddedEvent_GroupPermissionAddedEventFragment;
}

export function TimelineGroupPermissionAddedEvent({
  event,
}: TimelineGroupPermissionAddedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={UserGroupArrowIcon} color="white" backgroundColor="primary.500" />}
    >
      <FormattedMessage
        id="component.timeline-group-permission-added-event.description"
        defaultMessage="{user} shared this parallel with {groupName} as {permissionType} {timeAgo}"
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
  GroupPermissionAddedEvent: gql`
    fragment TimelineGroupPermissionAddedEvent_GroupPermissionAddedEvent on GroupPermissionAddedEvent {
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
