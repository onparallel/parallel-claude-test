import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { UserGroupXIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
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
      icon={<TimelineIcon icon={<UserGroupXIcon />} color="white" backgroundColor="red.500" />}
    >
      <FormattedMessage
        id="timeline.remove-group-permission-description"
        defaultMessage="{same, select, true {You} other {{user}}} stopped sharing this petition with {groupName} {timeAgo}"
        values={{
          same: userId === event.user?.id,
          user: <UserReference user={event.user} />,
          groupName: <Text as="strong">{event.permissionGroup.name}</Text>,
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
        name
      }
      createdAt
    }
    ${UserReference.fragments.User}
  `,
};
