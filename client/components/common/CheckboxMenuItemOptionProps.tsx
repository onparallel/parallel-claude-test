import { Checkbox, Flex, MenuItemOption } from "@chakra-ui/react";
import { ValueProps } from "@parallel/utils/ValueProps";
import { ReactElement } from "react";

export interface CheckboxMenuItemOptionProps
  extends ValueProps<boolean, false> {
  children?: ReactElement;
}
export function CheckboxMenuItemOption({
  children,
  value,
  onChange,
}: CheckboxMenuItemOptionProps) {
  return (
    <MenuItemOption
      icon={<></>}
      iconSpacing={0}
      isChecked={value}
      type="checkbox"
      onClick={() => onChange(!value)}
    >
      <Flex alignItems="center">
        <Checkbox
          role="presentation"
          pointerEvents="none"
          colorScheme="purple"
          isChecked={value}
          marginRight={2}
        />
        {children}
      </Flex>
    </MenuItemOption>
  );
}
