import { Menu, MenuButton, MenuButtonProps, Portal } from "@chakra-ui/core";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { FC, forwardRef } from "react";
import { PetitionFieldTypeSelectDropdown } from "./PetitionFieldTypeSelect";

export type AddFieldPopoverProps = MenuButtonProps & {
  onSelectFieldType: (type: PetitionFieldType) => void;
};

export const AddFieldPopover: FC<AddFieldPopoverProps> = forwardRef<
  HTMLButtonElement,
  AddFieldPopoverProps
>(function AddFieldPopover({ onSelectFieldType, ...props }, ref) {
  return (
    <Menu placement="bottom">
      <MenuButton ref={ref} {...props} />
      <Portal>
        <PetitionFieldTypeSelectDropdown
          onSelectFieldType={onSelectFieldType}
        />
      </Portal>
    </Menu>
  );
});
