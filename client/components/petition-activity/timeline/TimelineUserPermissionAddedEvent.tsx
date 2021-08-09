import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { UserArrowIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { PetitionPermissionTypeText } from "@parallel/components/petition-common/PetitionPermissionType";
import { TimelineUserPermissionAddedEvent_UserPermissionAddedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineUserPermissionAddedEventProps = {
  userId: string;
  event: TimelineUserPermissionAddedEvent_UserPermissionAddedEventFragment;
};

export function TimelineUserPermissionAddedEvent({
  event,
  userId,
}: TimelineUserPermissionAddedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<UserArrowIcon />} color="white" backgroundColor="purple.500" />}
    >
      <FormattedMessage
        id="timeline.add-user-permission-description"
        defaultMessage="{same, select, true {You} other {{user}}} shared this petition with {other} as {permissionType} {timeAgo}"
        values={{
          same: userId === event.user?.id,
          b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
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

TimelineUserPermissionAddedEvent.fragments = {
  UserPermissionAddedEvent: gql`
    fragment TimelineUserPermissionAddedEvent_UserPermissionAddedEvent on UserPermissionAddedEvent {
      user {
        ...UserReference_User
      }
      permissionUser {
        ...UserReference_User
      }
      permissionType
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactLink.fragments.Contact}
  `,
};
