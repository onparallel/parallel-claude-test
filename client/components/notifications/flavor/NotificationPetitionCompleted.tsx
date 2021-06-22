import { gql } from "@apollo/client";
import { Notification, NotificationBody } from "./Notification";
import { Avatar, Text } from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";

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

function Body() {
  return <NotificationBody body={"NotificationPetitionCompleted"} />;
}

export function NotificationPetitionCompleted({ notification }) {
  const { id, timestamp, isRead } = notification;
  return (
    <Notification
      id={id}
      icon={<NotificationAvatar />}
      body={<Body />}
      title={"NotificationPetitionCompleted"}
      timestamp={timestamp}
      isRead={isRead}
    />
  );
}

NotificationPetitionCompleted.fragments = {
  PetitionCompletedNotification: gql`
    fragment NotificationEmailBounced_PetitionCompletedNotification on PetitionCompletedNotification {
      id
      petitionId
      createdAt
    }
  `,
};
