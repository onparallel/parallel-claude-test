import {
  Button,
  ButtonProps,
  IconButton,
  IconButtonProps,
  Menu,
  MenuButton,
} from "@chakra-ui/core";
import { ReactNode } from "react";

type ButtonDropdownProps = {
  dropdown: ReactNode;
} & (
  | ({
      as?: typeof Button;
    } & Omit<ButtonProps, "as">)
  | ({
      as: typeof IconButton;
    } & Omit<IconButtonProps, "as">)
);

export function ButtonDropdown({
  as,
  dropdown,
  ...props
}: ButtonDropdownProps) {
  return (
    <Menu>
      <MenuButton as={as || Button} {...props} />
      {dropdown}
    </Menu>
  );
}
