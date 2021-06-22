import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
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

function Body() {
  return <NotificationBody body={"NotificationSignatureCompleted"} />;
}

export function NotificationSignatureCompleted({ notification }) {
  const { id, timestamp, isRead } = notification;
  return (
    <Notification
      id={id}
      icon={<NotificationAvatar />}
      body={<Body />}
      title={"NotificationSignatureCompleted"}
      timestamp={timestamp}
      isRead={isRead}
    />
  );
}

NotificationSignatureCompleted.fragments = {
  SignatureCompletedNotification: gql`
    fragment NotificationEmailBounced_SignatureCompletedNotification on SignatureCompletedNotification {
      id
      petitionId
      createdAt
    }
  `,
};
