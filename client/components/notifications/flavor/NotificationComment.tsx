import { gql } from "@apollo/client";
import { CommentIcon } from "@parallel/chakra/icons";
import { Notification, NotificationBody } from "./Notification";
import { Avatar, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

function NotificationAvatar() {
  return (
    <Avatar
      height="36px"
      width="36px"
      background="gray.200"
      icon={<CommentIcon fontSize="1rem" />}
    />
  );
}

export function NotificationComment({ notification }) {
  const { id, timestamp, isRead, title } = notification;

  const isInternal = false;

  const body = isInternal ? (
    <FormattedMessage
      id="ccomponent.notification-internal-comment.body"
      defaultMessage='<b>{name}</b> has written an internal comment in the field "{field}".'
      values={{
        name: "Destinatario",
        b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
        field: "Campo",
      }}
    />
  ) : (
    <FormattedMessage
      id="component.notification-comment.body"
      defaultMessage='<b>{name}</b> has written a comment in the field "{field}".'
      values={{
        name: "Destinatario",
        b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
        field: "Campo",
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

NotificationComment.fragments = {
  CommentCreatedNotification: gql`
    fragment NotificationComment_CommentCreatedNotification on CommentCreatedNotification {
      id
      petition
      author
      isInternal
      createdAt
    }
  `,
};
