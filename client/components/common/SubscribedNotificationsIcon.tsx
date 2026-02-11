import { Tooltip } from "@parallel/chakra/components";
import { BellOnIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { useIntl } from "react-intl";

export const SubscribedNotificationsIcon = chakraComponent<"svg">(
  function SubscribedNotificationsIcon({ ref, ...props }) {
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
