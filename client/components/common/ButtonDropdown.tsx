import { Button, Menu, MenuButton } from "@chakra-ui/core";
import { ComponentType, ReactNode, forwardRef } from "react";

type ButtonDropdownProps<T extends ComponentType<any> = typeof Button> = {
  dropdown: ReactNode;
  as?: T;
} & (T extends ComponentType<infer P> ? P : never);

function _ButtonDropdown<T extends ComponentType<any> = typeof Button>(
  { as, dropdown, ...props }: ButtonDropdownProps<T>,
  ref: any
) {
  return (
    <Menu>
      <MenuButton as={as || Button} {...props} ref={ref} />
      {dropdown}
    </Menu>
  );
}

export const ButtonDropdown: typeof _ButtonDropdown = forwardRef(
  _ButtonDropdown
) as any;
