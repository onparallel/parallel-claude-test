import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { UserArrowIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { UserPermissionType } from "@parallel/components/petition-common/UserPermissionType";
import { TimelineUserPermissionEditedEvent_UserPermissionEditedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineUserPermissionEditedEventProps = {
  userId: string;
  event: TimelineUserPermissionEditedEvent_UserPermissionEditedEventFragment;
};

export function TimelineUserPermissionEditedEvent({
  event,
  userId,
}: TimelineUserPermissionEditedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<UserArrowIcon />}
          color="white"
          backgroundColor="yellow.500"
        />
      }
    >
      <FormattedMessage
        id="timeline.edit-user-permission-description"
        defaultMessage="{same, select, true {You} other {{user}}} updated {other}'s permission to {permissionType} {timeAgo}"
        values={{
          same: userId === event.user?.id,
          b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
          user: <UserReference user={event.user} />,
          other: <UserReference user={event.permissionUser} />,
          permissionType: (
            <Text as="em" textTransform="lowercase">
              {<UserPermissionType type={event.permissionType} />}
            </Text>
          ),
          timeAgo: (
            <DateTime
              value={event.createdAt}
              format={FORMATS.LLL}
              useRelativeTime="always"
            />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelineUserPermissionEditedEvent.fragments = {
  UserPermissionEditedEvent: gql`
    fragment TimelineUserPermissionEditedEvent_UserPermissionEditedEvent on UserPermissionEditedEvent {
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
