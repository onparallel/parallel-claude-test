import { gql } from "@apollo/client";
import { Circle } from "@chakra-ui/react";
import { UserArrowIcon, UserGroupArrowIcon } from "@parallel/chakra/icons";
import { UserGroupReference } from "@parallel/components/common/UserGroupReference";
import { UserReference } from "@parallel/components/common/UserReference";
import { PetitionPermissionTypeText } from "@parallel/components/petition-common/PetitionPermissionType";
import { PetitionSharedUserNotification_PetitionSharedUserNotificationFragment } from "@parallel/graphql/__types";
import { RefAttributes } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface PetitionSharedUserNotificationProps {
  isFirst?: boolean;
  notification: PetitionSharedUserNotification_PetitionSharedUserNotificationFragment;
}

export function PetitionSharedUserNotification({
  isFirst,
  notification,
  ref,
}: PetitionSharedUserNotificationProps & RefAttributes<HTMLElement>) {
  const { petition, sharedWith } = notification;
  return (
    <PetitionUserNotification
      ref={ref}
      isFirst={isFirst}
      notification={notification}
      icon={
        <Circle size="36px" background="primary.500">
          {sharedWith?.__typename === "UserGroup" ? (
            <UserGroupArrowIcon color="white" fontSize="1rem" />
          ) : (
            <UserArrowIcon color="white" fontSize="1rem" />
          )}
        </Circle>
      }
      path={``}
    >
      {sharedWith?.__typename === "UserGroup" ? (
        notification.triggeredBy === "USER" ? (
          <FormattedMessage
            id="component.notification-petition-shared-group.triggered-by-user-body"
            defaultMessage="{name} has shared the {isTemplate, select, true {template} other {petition}} with the team {group} to which you belong."
            values={{
              isTemplate: petition.__typename === "PetitionTemplate",
              name: <UserReference user={notification.owner} />,
              group: <UserGroupReference fontWeight="bold" userGroup={sharedWith} />,
            }}
          />
        ) : (
          <FormattedMessage
            id="component.notification-petition-shared-group.triggered-by-system-body"
            defaultMessage="The {isTemplate, select, true {template} other {petition}} has been shared with the team {group} to which you belong."
            values={{
              isTemplate: petition.__typename === "PetitionTemplate",
              group: <UserGroupReference fontWeight="bold" userGroup={sharedWith} />,
            }}
          />
        )
      ) : sharedWith?.__typename === "User" ? (
        notification.triggeredBy === "USER" ? (
          <FormattedMessage
            id="component.notification-petition-shared.triggered-by-user-body"
            defaultMessage="{name} has shared the {isTemplate, select, true {template} other {parallel}} with you as {permissionType}."
            values={{
              name: <UserReference user={notification.owner} />,
              isTemplate: petition.__typename === "PetitionTemplate",
              permissionType: (
                <PetitionPermissionTypeText
                  type={notification.permissionType}
                  textTransform="lowercase"
                />
              ),
            }}
          />
        ) : (
          <FormattedMessage
            id="component.notification-petition-shared.triggered-by-system-body"
            defaultMessage="The {isTemplate, select, true {template} other {parallel}} has been shared with you as {permissionType}."
            values={{
              isTemplate: petition.__typename === "PetitionTemplate",
              permissionType: (
                <PetitionPermissionTypeText
                  type={notification.permissionType}
                  textTransform="lowercase"
                />
              ),
            }}
          />
        )
      ) : null}
    </PetitionUserNotification>
  );
}

const _fragments = {
  PetitionSharedUserNotification: gql`
    fragment PetitionSharedUserNotification_PetitionSharedUserNotification on PetitionSharedUserNotification {
      ...PetitionUserNotification_PetitionUserNotification
      petition {
        __typename
      }
      triggeredBy
      owner {
        ...UserReference_User
      }
      sharedWith {
        ... on User {
          ...UserReference_User
        }
        ... on UserGroup {
          ...UserGroupReference_UserGroup
        }
      }
      permissionType
    }
  `,
};
