import { gql } from "@apollo/client";
import { Notification, NotificationBody } from "./Notification";
import { Avatar } from "@chakra-ui/react";
import { EmailXIcon } from "@parallel/chakra/icons";

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

function Body() {
  return <NotificationBody body={"NotificationEmailBounced"} />;
}

export function NotificationEmailBounced({ notification }) {
  const { id, timestamp, isRead } = notification;
  return (
    <Notification
      id={id}
      icon={<NotificationAvatar />}
      body={<Body />}
      title={"NotificationEmailBounced"}
      timestamp={timestamp}
      isRead={isRead}
    />
  );
}

NotificationEmailBounced.fragments = {
  MessageEmailBouncedNotification: gql`
    fragment NotificationEmailBounced_MessageEmailBouncedNotification on MessageEmailBouncedNotification {
      id
      petitionId
      createdAt
    }
  `,
};
