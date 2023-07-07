import { Tooltip } from "@chakra-ui/react";
import { BellOnIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useIntl } from "react-intl";

export const SubscribedNotificationsIcon = chakraForwardRef<"svg">(
  function SubscribedNotificationsIcon({ ...props }, ref) {
    const intl = useIntl();
    return (
      <Tooltip
        label={intl.formatMessage({
          id: "component.subscribed-notifications-icon.label",
          defaultMessage: "Subscribed to notifications",
        })}
      >
        <BellOnIcon ref={ref} {...(props as any)} />
      </Tooltip>
    );
  },
);
