import { gql } from "@apollo/client";
import { UserGroupArrowIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { PetitionPermissionTypeText } from "@parallel/components/petition-common/PetitionPermissionType";
import { TimelineGroupPermissionAddedEvent_GroupPermissionAddedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserGroupReference } from "../UserGroupReference";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineGroupPermissionAddedEventProps = {
  userId: string;
  event: TimelineGroupPermissionAddedEvent_GroupPermissionAddedEventFragment;
};

export function TimelineGroupPermissionAddedEvent({
  event,
  userId,
}: TimelineGroupPermissionAddedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon icon={<UserGroupArrowIcon />} color="white" backgroundColor="primary.500" />
      }
    >
      <FormattedMessage
        id="timeline.add-group-permission-description"
        defaultMessage="{userIsYou, select, true {You} other {{user}}} shared this parallel with {groupName} as {permissionType} {timeAgo}"
        values={{
          userIsYou: userId === event.user?.id,
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

TimelineGroupPermissionAddedEvent.fragments = {
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
    ${UserReference.fragments.User}
    ${UserGroupReference.fragments.UserGroup}
  `,
};
