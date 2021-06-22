import { gql } from "@apollo/client";
import { Notification, NotificationBody } from "./Notification";
import { Avatar, Text } from "@chakra-ui/react";
import { UserArrowIcon, UserGroupArrowIcon } from "@parallel/chakra/icons";
import { FormattedMessage } from "react-intl";
import { PetitionPermissionTypeText } from "@parallel/components/petition-common/PetitionPermissionType";

function NotificationAvatar() {
  const isGroup = false;
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

export function NotificationPetitionShared({ notification }) {
  const { id, timestamp, isRead, title } = notification;

  const sharedGroup = false;

  const permissionType = "OWNER";

  const body = sharedGroup ? (
    <FormattedMessage
      id="ccomponent.notification-petition-shared-group.body"
      defaultMessage='<b>{name}</b> has shared the request with the group "{group}" to which you belong.'
      values={{
        name: "Fullname destinatario",
        group: "Grupo 1",
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

  const createdAt = timestamp;
  const petition = { name: title };

  return (
    <Notification
      id={id}
      icon={<NotificationAvatar />}
      body={<NotificationBody body={body} />}
      title={petition.name}
      timestamp={createdAt}
      isRead={isRead}
    />
  );
}

NotificationPetitionShared.fragments = {
  PetitionSharedNotification: gql`
    fragment NotificationEmailBounced_PetitionSharedNotification on PetitionSharedNotification {
      id
      petition
      owner
      permissionType
      sharedWith
      createdAt
    }
  `,
};
