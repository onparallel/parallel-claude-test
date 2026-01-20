import { gql } from "@apollo/client";
import { UserXIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineUserPermissionRemovedEvent_UserPermissionRemovedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineUserPermissionRemovedEventProps {
  event: TimelineUserPermissionRemovedEvent_UserPermissionRemovedEventFragment;
}

export function TimelineUserPermissionRemovedEvent({
  event,
}: TimelineUserPermissionRemovedEventProps) {
  return (
    <TimelineItem icon={<TimelineIcon icon={UserXIcon} color="white" backgroundColor="red.500" />}>
      <FormattedMessage
        id="component.timeline-user-permission-removed-event.description"
        defaultMessage="{user} stopped sharing this parallel with {other} {timeAgo}"
        values={{
          user: <UserReference user={event.user} />,
          other: <UserReference user={event.permissionUser} />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

const _fragments = {
  UserPermissionRemovedEvent: gql`
    fragment TimelineUserPermissionRemovedEvent_UserPermissionRemovedEvent on UserPermissionRemovedEvent {
      user {
        ...UserReference_User
      }
      permissionUser {
        ...UserReference_User
      }
      createdAt
    }
  `,
};
