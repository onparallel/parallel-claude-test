import { gql } from "@apollo/client";
import { UserXIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineUserPermissionRemovedEvent_UserPermissionRemovedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineUserPermissionRemovedEventProps = {
  userId: string;
  event: TimelineUserPermissionRemovedEvent_UserPermissionRemovedEventFragment;
};

export function TimelineUserPermissionRemovedEvent({
  event,
  userId,
}: TimelineUserPermissionRemovedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<UserXIcon />} color="white" backgroundColor="red.500" />}
    >
      <FormattedMessage
        id="timeline.remove-user-permission-description"
        defaultMessage="{userIsYou, select, true {You} other {{user}}} stopped sharing this parallel with {other} {timeAgo}"
        values={{
          userIsYou: userId === event.user?.id,
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

TimelineUserPermissionRemovedEvent.fragments = {
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
    ${UserReference.fragments.User}
  `,
};
