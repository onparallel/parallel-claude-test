import { gql } from "@apollo/client";
import { CommentIcon } from "@parallel/chakra/icons";
import { Notification, NotificationBody } from "./Notification";
import { Avatar } from "@chakra-ui/react";

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

function Body() {
  return <NotificationBody body={"NotificationComment"} />;
}

export function NotificationComment({ notification }) {
  const { id, timestamp, isRead } = notification;
  return (
    <Notification
      id={id}
      icon={<NotificationAvatar />}
      body={<Body />}
      title={"NotificationComment"}
      timestamp={timestamp}
      isRead={isRead}
    />
  );
}

NotificationComment.fragments = {
  CommentCreatedNotification: gql`
    fragment NotificationComment_CommentCreatedNotification on CommentCreatedNotification {
      id
      petitionId
      createdAt
    }
  `,
};
