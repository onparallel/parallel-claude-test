import { gql } from "@apollo/client";
import { Notification, NotificationBody } from "./Notification";
import { Avatar, Text } from "@chakra-ui/react";
import { EmailXIcon } from "@parallel/chakra/icons";
import { FormattedMessage } from "react-intl";

function NotificationAvatar() {
  return (
    <Avatar
      height="36px"
      width="36px"
      background="red.500"
      icon={<EmailXIcon color="white" fontSize="1rem" />}
    />
  );
}

export function NotificationEmailBounced({ notification }) {
  const { id, timestamp, isRead, title } = notification;

  const body = (
    <FormattedMessage
      id="ccomponent.notification-email-bounced.body"
      defaultMessage="Error sending request to recipient <b>{name}</b> ({email})."
      values={{
        name: "Fullname destinatario",
        b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
        email: "destinatario@sumail.com",
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

NotificationEmailBounced.fragments = {
  MessageEmailBouncedNotification: gql`
    fragment NotificationEmailBounced_MessageEmailBouncedNotification on MessageEmailBouncedNotification {
      id
      petition
      access
      createdAt
    }
  `,
};
