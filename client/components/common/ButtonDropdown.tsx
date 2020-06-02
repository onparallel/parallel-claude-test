import { Button, Menu, MenuButton } from "@chakra-ui/core";
import { ComponentType, ReactNode } from "react";

type ButtonDropdownProps<T extends ComponentType<any> = typeof Button> = {
  dropdown: ReactNode;
  as?: T;
} & (T extends ComponentType<infer P> ? P : never);

export function ButtonDropdown<T extends ComponentType<any> = typeof Button>({
  as,
  dropdown,
  ...props
}: ButtonDropdownProps<T>) {
  return (
    <Menu>
      <MenuButton as={as || Button} {...props} />
      {dropdown}
    </Menu>
  );
}
