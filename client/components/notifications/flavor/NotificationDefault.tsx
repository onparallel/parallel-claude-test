import { Notification } from "./Notification";
import { Avatar } from "@chakra-ui/react";
import { CommentXIcon } from "@parallel/chakra/icons";

function NotificationAvatar() {
  return (
    <Avatar
      height="36px"
      width="36px"
      background="gray.200"
      icon={<CommentXIcon fontSize="1rem" />}
    />
  );
}

function Body() {
  return <NotificationBody body={"NotificationComment"} />;
}

export function NotificationDefault({ notification }) {
  const { id, timestamp, isRead } = notification;
  return (
    <Notification
      id={id}
      icon={<NotificationAvatar />}
      body={<Body />}
      title={"NotificationDefault"}
      timestamp={timestamp}
      isRead={isRead}
    />
  );
}
