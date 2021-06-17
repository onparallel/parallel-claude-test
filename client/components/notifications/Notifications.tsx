import { useDisclosure } from "@chakra-ui/hooks";
import { useEffect, useState } from "react";
import { Bell } from "./Bell";
import { NotificationsDrawer } from "./NotificationsDrawer";

export function Notifications() {
  const bellStateProps = {
    closed: { color: "gray.800", backgroundColor: "white" },
    opened: { color: "purple.500", backgroundColor: "gray.100" },
  };

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [hasNotifications, setHasNotifications] = useState(false);

  const [bellProps, setBellProps] = useState({});

  const handleBellClick = () => {
    isOpen ? handleClose() : handleOpen();
  };

  const handleClose = () => {
    onClose();
    setBellProps(bellStateProps.closed);
  };

  const handleOpen = () => {
    onOpen();
    setBellProps(bellStateProps.opened);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setHasNotifications((v) => !v);
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <Bell
        onClick={handleBellClick}
        hasNotifications={hasNotifications}
        isOpen={isOpen}
        {...bellProps}
      />
      <NotificationsDrawer isOpen={isOpen} onClose={handleClose} />
    </>
  );
}
