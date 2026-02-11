import { IconButton, IconButtonProps, MenuButton, MenuProps, Portal } from "@chakra-ui/react";
import { Menu, Tooltip } from "@parallel/chakra/components";
import { MoreVerticalIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { useIntl } from "react-intl";

export interface MoreOptionsMenuButtonProps extends Omit<IconButtonProps, "aria-label"> {
  label?: string;
  menuProps?: Omit<MenuProps, "children">;
  options: ReactNode;
}

export const MoreOptionsMenuButton = chakraComponent<"button", MoreOptionsMenuButtonProps>(
  function MoreOptionsMenuButton({ ref, options, menuProps, label, ...props }) {
    const intl = useIntl();
    const _label =
      label ??
      intl.formatMessage({
        id: "generic.more-options",
        defaultMessage: "More options...",
      });
    return (
      <Menu placement="bottom-end" {...menuProps}>
        <Tooltip label={_label} placement="bottom-start">
          <MenuButton
            ref={ref}
            as={IconButton}
            icon={<MoreVerticalIcon />}
            aria-label={_label}
            {...props}
          />
        </Tooltip>
        <Portal>{options}</Portal>
      </Menu>
    );
  },
);
