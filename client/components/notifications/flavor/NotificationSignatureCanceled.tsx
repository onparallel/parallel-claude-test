import { gql } from "@apollo/client";
import { Notification, NotificationBody } from "./Notification";
import { Avatar } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { FormattedMessage } from "react-intl";

function NotificationAvatar() {
  return (
    <Avatar
      height="36px"
      width="36px"
      background="red.500"
      icon={<SignatureIcon color="white" fontSize="1rem" />}
    />
  );
}

export function NotificationSignatureCanceled({ notification }) {
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
              id="component.notification-signature-canceled.body"
              defaultMessage="The digital signature has been canceled."
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

NotificationSignatureCanceled.fragments = {
  SignatureCancelledNotification: gql`
    fragment NotificationEmailBounced_SignatureCancelledNotification on SignatureCancelledNotification {
      id
      petition
      author
      createdAt
    }
  `,
};
