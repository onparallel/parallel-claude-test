import { Menu, MenuButton, Portal } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { FC, forwardRef } from "react";
import { PetitionFieldTypeSelectDropdown } from "./PetitionFieldTypeSelectDropdown";

export type AddFieldPopoverProps = ExtendChakra<{
  onSelectFieldType: (type: PetitionFieldType) => void;
}>;

export const AddFieldPopover: FC<AddFieldPopoverProps> = forwardRef<
  HTMLButtonElement,
  AddFieldPopoverProps
>(function AddFieldPopover({ onSelectFieldType, ...props }, ref) {
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
});
