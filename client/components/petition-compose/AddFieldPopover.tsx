import { Menu, MenuButton, Portal } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { PetitionFieldTypeSelectDropdown } from "./PetitionFieldTypeSelectDropdown";

export interface AddFieldPopoverProps {
  onSelectFieldType: (type: PetitionFieldType) => void;
}

export const AddFieldPopover = chakraForwardRef<"button", AddFieldPopoverProps>(
  function AddFieldPopover({ onSelectFieldType, ...props }, ref) {
    return (
      <Menu placement="bottom">
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
