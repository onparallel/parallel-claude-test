import { useDisclosure } from "@chakra-ui/hooks";
import { useRef } from "react";
import { useEffect, useState } from "react";
import { notificationsMock, unreadedNotificationsMock } from "./mocks";
import { NotificationsBell } from "./NotificationsBell";
import { NotificationsDrawer } from "./NotificationsDrawer";

export function Notifications() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [unreadNotificationIds, setUnreadNotificationIds] = useState(
    unreadedNotificationsMock
  );
  const [notifications, setNotifications] = useState(notificationsMock);

  const [hasMore, setHasMore] = useState(false);

  const selectedFilter = useRef("ALL");

  const handleBellClick = () => {
    isOpen ? handleClose() : handleOpen();
  };

  const handleClose = () => {
    onClose();
  };

  const handleOpen = () => {
    onOpen();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setUnreadNotificationIds((un) => {
        if (un.length) {
          return [];
        } else {
          return unreadedNotificationsMock;
        }
      });
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchData = () => {
    if (notifications.length > 30) {
      if (hasMore) setHasMore(false);
      return;
    }
    setTimeout(() => {
      setNotifications((n) => [
        ...n,
        ...n.map((v, index) => {
          const a = { ...v };
          a.id = n.length + index + 1;
          return a;
        }),
      ]);
    }, 2000);
  };

  const handleChangeFilterBy = (type: string) => {
    selectedFilter.current = type;
    setNotifications(() =>
      notificationsMock.filter((v) => {
        switch (type) {
          case "ALL":
            return true;
          case "UNREAD":
            return !v.isRead;
          case "COMMENTS":
            return v.type === "COMMENT_CREATED";
          case "COMPLETED":
            return v.type === "PETITION_COMPLETED";
          case "SHARED":
            return v.type === "PETITION_SHARED";
          case "OTHERS":
            return [
              "SIGNATURE_COMPLETED",
              "SIGNATURE_CANCELLED",
              "MESSAGE_EMAIL_BOUNCED",
            ].includes(v.type);
          default:
            break;
        }
      })
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((n) =>
      n.map((v) => {
        v.isRead = true;
        return v;
      })
    );
  };

  return (
    <>
      <NotificationsBell
        onClick={handleBellClick}
        hasNotifications={unreadNotificationIds.length > 0}
        isOpen={isOpen}
      />
      <NotificationsDrawer
        fetchData={fetchData}
        notifications={notifications}
        isOpen={isOpen}
        onClose={handleClose}
        hasMore={hasMore}
        selectedFilter={selectedFilter.current}
        onChangeFilterBy={handleChangeFilterBy}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </>
  );
}
