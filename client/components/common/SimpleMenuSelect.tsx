import {
  Button,
  ButtonProps,
  MenuButton,
  MenuDivider,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
} from "@chakra-ui/react";
import { Menu } from "@parallel/chakra/components";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { unMaybeArray } from "@parallel/utils/types";
import { FormattedList } from "react-intl";
import { SimpleOption } from "./SimpleSelect";

export interface SimpleMenuSelectProps<T extends string = string, IsMulti extends boolean = false>
  extends Omit<ButtonProps, "onChange"> {
  isMulti?: IsMulti;
  options: (SimpleOption<T> | "DIVIDER")[];
  value: IsMulti extends true ? T[] : T;
  onChange: IsMulti extends true ? (value: T[]) => void : (value: T) => void;
}

export function SimpleMenuSelect<T extends string = string, IsMulti extends boolean = false>({
  isMulti,
  options,
  value,
  onChange,
  ...props
}: SimpleMenuSelectProps<T, IsMulti>) {
  return (
    <Menu placement="bottom-start">
      <MenuButton
        as={Button}
        fontWeight={400}
        rightIcon={<ChevronDownIcon boxSize={4} />}
        {...(props as any)}
      >
        <FormattedList
          value={unMaybeArray(value).map(
            (v) => (options.find((o) => o !== "DIVIDER" && o.value === v)! as SimpleOption).label,
          )}
          style="short"
        />
      </MenuButton>
      <Portal>
        <MenuList fontSize="sm" minWidth={0} width="auto">
          <MenuOptionGroup
            value={value}
            onChange={onChange as any}
            type={isMulti ? "checkbox" : "radio"}
          >
            {options.map((o, i) =>
              o === "DIVIDER" ? (
                <MenuDivider key={i} />
              ) : (
                <MenuItemOption key={o.value} value={o.value}>
                  {o.label}
                </MenuItemOption>
              ),
            )}
          </MenuOptionGroup>
        </MenuList>
      </Portal>
    </Menu>
  );
}
