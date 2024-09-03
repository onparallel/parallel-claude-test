import {
  Button,
  ButtonProps,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
} from "@chakra-ui/react";
import { Menu } from "@parallel/chakra/components";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { SimpleOption } from "./SimpleSelect";

export interface SimpleMenuSelectProps extends Omit<ButtonProps, "onChange"> {
  options: SimpleOption[];
  value: string;
  onChange: (value: string) => void;
}

export const SimpleMenuSelect = chakraForwardRef<"button", SimpleMenuSelectProps>(
  function SimpleMenuSelect({ options, value, onChange, ...props }, ref) {
    return (
      <Menu placement="bottom-start">
        <MenuButton
          ref={ref}
          as={Button}
          fontWeight={400}
          rightIcon={<ChevronDownIcon boxSize={4} />}
          {...(props as any)}
        >
          {options.find((o) => o.value === value)?.label}
        </MenuButton>
        <Portal>
          <MenuList fontSize="sm" minWidth={0} width="auto">
            <MenuOptionGroup value={value} onChange={onChange as any} type="radio">
              {options.map((o) => (
                <MenuItemOption key={o.value} value={o.value}>
                  {o.label}
                </MenuItemOption>
              ))}
            </MenuOptionGroup>
          </MenuList>
        </Portal>
      </Menu>
    );
  },
);
