import { gql } from "@apollo/client";
import { Notification, NotificationBody } from "./Notification";
import { Avatar, Text } from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { FormattedMessage } from "react-intl";

function NotificationAvatar() {
  return (
    <Avatar
      height="36px"
      width="36px"
      background="green.600"
      icon={<CheckIcon color="white" fontSize="1rem" />}
    />
  );
}

export function NotificationPetitionCompleted({ notification }) {
  const { id, timestamp, isRead, title } = notification;

  const body = (
    <FormattedMessage
      id="ccomponent.notification-petition-completed.body"
      defaultMessage="<b>{name}</b> completed the petition."
      values={{
        name: "Fullname destinatario",
        b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
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

NotificationPetitionCompleted.fragments = {
  PetitionCompletedNotification: gql`
    fragment NotificationEmailBounced_PetitionCompletedNotification on PetitionCompletedNotification {
      id
      petition
      access
      createdAt
    }
  `,
};
