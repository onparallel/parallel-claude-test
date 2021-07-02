import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { UserArrowIcon, UserGroupArrowIcon } from "@parallel/chakra/icons";
import { UserReference } from "@parallel/components/petition-activity/UserReference";
import { PetitionPermissionTypeText } from "@parallel/components/petition-common/PetitionPermissionType";
import { PetitionSharedUserNotification_PetitionSharedUserNotificationFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface PetitionSharedUserNotificationProps {
  isFirst?: boolean;
  notification: PetitionSharedUserNotification_PetitionSharedUserNotificationFragment;
}

export const PetitionSharedUserNotification = Object.assign(
  forwardRef<HTMLElement, PetitionSharedUserNotificationProps>(
    function PetitionSharedUserNotification({ isFirst, notification }, ref) {
      return (
        <PetitionUserNotification
          ref={ref}
          isFirst={isFirst}
          notification={notification}
          icon={
            <Avatar
              boxSize="36px"
              background="purple.500"
              icon={
                notification.sharedWith.__typename === "UserGroup" ? (
                  <UserGroupArrowIcon color="white" fontSize="1rem" />
                ) : (
                  <UserArrowIcon color="white" fontSize="1rem" />
                )
              }
            />
          }
          path={``}
        >
          {notification.sharedWith.__typename === "UserGroup" ? (
            <FormattedMessage
              id="component.notification-petition-shared-group.body"
              defaultMessage='{name} has shared the petition with the group "{group}" to which you belong.'
              values={{
                name: <UserReference user={notification.owner} />,
                group: notification.sharedWith.name,
              }}
            />
          ) : (
            <FormattedMessage
              id="component.notification-petition-shared.body"
              defaultMessage="{name} has shared the petition with you as {permissionType}."
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
  ),
  {
    fragments: {
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
    },
  }
);
