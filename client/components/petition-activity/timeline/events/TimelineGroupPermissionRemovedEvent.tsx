import { gql } from "@apollo/client";
import { UserGroupXIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserGroupReference } from "../../../common/UserGroupReference";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineGroupPermissionRemovedEventProps {
  event: TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEventFragment;
}

export function TimelineGroupPermissionRemovedEvent({
  event,
}: TimelineGroupPermissionRemovedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={UserGroupXIcon} color="white" backgroundColor="red.500" />}
    >
      <FormattedMessage
        id="component.timeline-group-permission-removed-event.description"
        defaultMessage="{user} stopped sharing this parallel with {groupName} {timeAgo}"
        values={{
          user: <UserReference user={event.user} />,
          groupName: <UserGroupReference userGroup={event.permissionGroup} as="strong" />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelineGroupPermissionRemovedEvent.fragments = {
  GroupPermissionRemovedEvent: gql`
    fragment TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEvent on GroupPermissionRemovedEvent {
      user {
        ...UserReference_User
      }
      permissionGroup {
        ...UserGroupReference_UserGroup
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${UserGroupReference.fragments.UserGroup}
  `,
};
