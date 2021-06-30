import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { UserArrowIcon, UserGroupArrowIcon } from "@parallel/chakra/icons";
import { UserReference } from "@parallel/components/petition-activity/UserReference";
import { PetitionPermissionTypeText } from "@parallel/components/petition-common/PetitionPermissionType";
import { PetitionSharedUserNotification_PetitionSharedUserNotificationFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface PetitionSharedUserNotificationProps {
  notification: PetitionSharedUserNotification_PetitionSharedUserNotificationFragment;
}

export function PetitionSharedUserNotification({
  notification,
}: PetitionSharedUserNotificationProps) {
  return (
    <PetitionUserNotification
      notification={notification}
      icon={
        <NotificationAvatar
          isGroup={notification.sharedWith.__typename === "UserGroup"}
        />
      }
      path={``}
    >
      {notification.sharedWith.__typename === "UserGroup" ? (
        <FormattedMessage
          id="component.notification-petition-shared-group.body"
          defaultMessage='{name} has shared the request with the group "{group}" to which you belong.'
          values={{
            name: <UserReference user={notification.owner} />,
            group: notification.sharedWith.name,
          }}
        />
      ) : (
        <FormattedMessage
          id="component.notification-petition-shared.body"
          defaultMessage="{name} has shared the request with you as {permissionType}."
          values={{
            name: <UserReference user={notification.owner} />,
            permissionType: (
              <PetitionPermissionTypeText
                type={notification.permissionType}
                textTransform="lowercase"
              />
            ),
          }}
        />
      )}
    </PetitionUserNotification>
  );
}

function NotificationAvatar({ isGroup }: { isGroup: boolean }) {
  return isGroup ? (
    <Avatar
      height="36px"
      width="36px"
      background="purple.500"
      icon={<UserGroupArrowIcon color="white" fontSize="1rem" />}
    />
  ) : (
    <Avatar
      height="36px"
      width="36px"
      background="purple.500"
      icon={<UserArrowIcon color="white" fontSize="1rem" />}
    />
  );
}

PetitionSharedUserNotification.fragments = {
  PetitionSharedUserNotification: gql`
    fragment PetitionSharedUserNotification_PetitionSharedUserNotification on PetitionSharedUserNotification {
      ...PetitionUserNotification_PetitionUserNotification
      owner {
        ...UserReference_User
      }
      sharedWith {
        ... on User {
          ...UserReference_User
        }
        ... on UserGroup {
          id
          name
        }
      }
      permissionType
    }
    ${PetitionUserNotification.fragments.PetitionUserNotification}
    ${UserReference.fragments.User}
  `,
};
