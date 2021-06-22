import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { FormattedMessage } from "react-intl";
import { Notification, NotificationBody } from "./Notification";

function NotificationAvatar() {
  return (
    <Avatar
      height="36px"
      width="36px"
      background="green.500"
      icon={<SignatureIcon color="white" fontSize="1rem" />}
    />
  );
}

export function NotificationSignatureCompleted({ notification }) {
  const { id, timestamp, isRead, title } = notification;

  const createdAt = timestamp;
  const petition = { name: title };

  return (
    <Notification
      id={id}
      icon={<NotificationAvatar />}
      body={
        <NotificationBody
          body={
            <FormattedMessage
              id="component.notification-signature-completed.body"
              defaultMessage="The digital signature has been completed."
            />
          }
        />
      }
      title={petition.name}
      timestamp={createdAt}
      isRead={isRead}
    />
  );
}

NotificationSignatureCompleted.fragments = {
  SignatureCompletedNotification: gql`
    fragment NotificationEmailBounced_SignatureCompletedNotification on SignatureCompletedNotification {
      id
      petition
      contact
      createdAt
    }
  `,
};
