import {
  IconButton,
  IconButtonProps,
  Menu,
  MenuButton,
  MenuProps,
  Portal,
  Tooltip,
} from "@chakra-ui/react";
import { MoreVerticalIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { useIntl } from "react-intl";

export interface MoreOptionsMenuButtonProps extends Omit<IconButtonProps, "aria-label"> {
  label?: string;
  menuProps?: MenuProps;
  options: ReactNode;
}

export const MoreOptionsMenuButton = chakraForwardRef<"button", MoreOptionsMenuButtonProps>(
  function MoreOptionsMenuButton({ options, menuProps, label, ...props }, ref) {
    const intl = useIntl();
    const _label =
      label ??
      intl.formatMessage({
        id: "generic.more-options",
        defaultMessage: "More options...",
      });
    return (
      <Menu placement="bottom-end" {...menuProps}>
        <Tooltip label={_label}>
          <MenuButton as={IconButton} icon={<MoreVerticalIcon />} aria-label={_label} {...props} />
        </Tooltip>
        <Portal>{options}</Portal>
      </Menu>
    );
  }
);
