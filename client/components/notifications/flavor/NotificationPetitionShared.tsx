import { gql } from "@apollo/client";
import { Notification, NotificationBody } from "./Notification";
import { Avatar } from "@chakra-ui/react";
import { UserArrowIcon, UserGroupArrowIcon } from "@parallel/chakra/icons";

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

function Body() {
  return <NotificationBody body={"NotificationPetitionShared"} />;
}
export function NotificationPetitionShared({ notification }) {
  const { id, timestamp, isRead } = notification;
  return (
    <Notification
      id={id}
      icon={<NotificationAvatar />}
      body={<Body />}
      title={"NotificationPetitionShared"}
      timestamp={timestamp}
      isRead={isRead}
    />
  );
}

NotificationPetitionShared.fragments = {
  PetitionSharedNotification: gql`
    fragment NotificationEmailBounced_PetitionSharedNotification on PetitionSharedNotification {
      id
      petitionId
      createdAt
    }
  `,
};
