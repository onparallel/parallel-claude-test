import { gql } from "@apollo/client";
import { Notification, NotificationBody } from "./Notification";
import { Avatar } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";

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

function Body() {
  return <NotificationBody body={"NotificationSignatureCanceled"} />;
}

export function NotificationSignatureCanceled({ notification }) {
  const { id, timestamp, isRead } = notification;
  return (
    <Notification
      id={id}
      icon={<NotificationAvatar />}
      body={<Body />}
      title={"NotificationSignatureCanceled"}
      timestamp={timestamp}
      isRead={isRead}
    />
  );
}

NotificationSignatureCanceled.fragments = {
  SignatureCancelledNotification: gql`
    fragment NotificationEmailBounced_SignatureCancelledNotification on SignatureCancelledNotification {
      id
      petitionId
      createdAt
    }
  `,
};
