import { gql } from "@apollo/client";
import { UserGroupXIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserGroupReference } from "../UserGroupReference";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineGroupPermissionRemovedEventProps = {
  userId: string;
  event: TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEventFragment;
};

export function TimelineGroupPermissionRemovedEvent({
  event,
  userId,
}: TimelineGroupPermissionRemovedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={UserGroupXIcon} color="white" backgroundColor="red.500" />}
    >
      <FormattedMessage
        id="timeline.remove-group-permission-description"
        defaultMessage="{userIsYou, select, true {You} other {{user}}} stopped sharing this parallel with {groupName} {timeAgo}"
        values={{
          userIsYou: userId === event.user?.id,
          user: <UserReference user={event.user} />,
          groupName: <UserGroupReference userGroup={event.permissionGroup} />,
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
