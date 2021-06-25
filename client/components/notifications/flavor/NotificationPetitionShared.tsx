import { gql } from "@apollo/client";
import { Notification, NotificationBody } from "./Notification";
import { Avatar, Text } from "@chakra-ui/react";
import { UserArrowIcon, UserGroupArrowIcon } from "@parallel/chakra/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { PetitionPermissionTypeText } from "@parallel/components/petition-common/PetitionPermissionType";
import {
  PetitionBase,
  PetitionPermissionType,
  User,
  UserOrUserGroup,
} from "@parallel/graphql/__types";

export interface NotificationPetitionSharedProps {
  id: string;
  petition: PetitionBase;
  owner: User;
  sharedWith: UserOrUserGroup;
  permissionType: PetitionPermissionType;
  createdAt: string;
  isRead: boolean;
}

export function NotificationPetitionShared({
  id,
  petition,
  owner,
  sharedWith,
  permissionType,
  createdAt,
  isRead,
}: NotificationPetitionSharedProps) {
  const intl = useIntl();

  const petitionTitle =
    petition.name ??
    intl.formatMessage({
      id: "generic.untitled-petition",
      defaultMessage: "Untitled petition",
    });

  const isSharedGroup = sharedWith.__typename === "UserGroup";

  const body = isSharedGroup ? (
    <FormattedMessage
      id="ccomponent.notification-petition-shared-group.body"
      defaultMessage='<b>{name}</b> has shared the request with the group "{group}" to which you belong.'
      values={{
        name: owner.fullName,
        group: sharedWith.__typename === "UserGroup" ? sharedWith.name : "",
        b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
      }}
    />
  ) : (
    <FormattedMessage
      id="ccomponent.notification-petition-shared.body"
      defaultMessage="<b>{name}</b> has shared the request with you as {permissionType}."
      values={{
        name: "Fullname destinatario",
        b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
        permissionType: (
          <PetitionPermissionTypeText
            type={permissionType}
            textTransform="lowercase"
          />
        ),
      }}
    />
  );

  return (
    <Notification
      id={id}
      icon={<NotificationAvatar isGroup={isSharedGroup} />}
      body={<NotificationBody body={body} />}
      title={petitionTitle}
      timestamp={createdAt}
      isRead={isRead}
    />
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

NotificationPetitionShared.fragments = {
  PetitionSharedUserNotification: gql`
    fragment NotificationEmailBounced_PetitionSharedUserNotification on PetitionSharedUserNotification {
      id
      petition {
        id
        name
      }
      owner {
        id
        fullName
      }
      sharedWith {
        ... on User {
          id
          fullName
        }
        ... on UserGroup {
          id
          name
        }
      }
      permissionType
      createdAt
    }
  `,
};
