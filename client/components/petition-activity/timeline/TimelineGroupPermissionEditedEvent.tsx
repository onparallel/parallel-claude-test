import { gql } from "@apollo/client";
import { UserGroupArrowIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { PetitionPermissionTypeText } from "@parallel/components/petition-common/PetitionPermissionType";
import { TimelineGroupPermissionEditedEvent_GroupPermissionEditedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserGroupReference } from "../UserGroupReference";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineGroupPermissionEditedEventProps = {
  userId: string;
  event: TimelineGroupPermissionEditedEvent_GroupPermissionEditedEventFragment;
};

export function TimelineGroupPermissionEditedEvent({
  event,
  userId,
}: TimelineGroupPermissionEditedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon icon={<UserGroupArrowIcon />} color="white" backgroundColor="yellow.500" />
      }
    >
      <FormattedMessage
        id="timeline.edit-group-permission-description"
        defaultMessage="{same, select, true {You} other {{user}}} updated {groupName}'s permission to {permissionType} {timeAgo}"
        values={{
          same: userId === event.user?.id,
          user: <UserReference user={event.user} />,
          groupName: <UserGroupReference userGroup={event.permissionGroup} />,
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

TimelineGroupPermissionEditedEvent.fragments = {
  GroupPermissionEditedEvent: gql`
    fragment TimelineGroupPermissionEditedEvent_GroupPermissionEditedEvent on GroupPermissionEditedEvent {
      user {
        ...UserReference_User
      }
      permissionGroup {
        name
      }
      permissionType
      createdAt
    }
    ${UserReference.fragments.User}
  `,
};
