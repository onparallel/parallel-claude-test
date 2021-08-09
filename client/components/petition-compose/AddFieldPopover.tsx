import { Menu, MenuButton, MenuProps, Portal } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { PetitionFieldTypeSelectDropdown } from "./PetitionFieldTypeSelectDropdown";

export interface AddFieldPopoverProps extends Pick<MenuProps, "onOpen" | "onClose"> {
  onSelectFieldType: (type: PetitionFieldType) => void;
}

export const AddFieldPopover = chakraForwardRef<"button", AddFieldPopoverProps>(
  function AddFieldPopover({ id, onSelectFieldType, onOpen, onClose, ...props }, ref) {
    return (
      <Menu id={id} placement="bottom" onOpen={onOpen} onClose={onClose}>
        <MenuButton ref={ref} {...props} />
        <Portal>
          <PetitionFieldTypeSelectDropdown
            showDescription
            showHeader
            onSelectFieldType={onSelectFieldType}
          />
        </Portal>
      </Menu>
    );
  }
);
