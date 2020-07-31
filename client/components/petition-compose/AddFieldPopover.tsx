import { Button, ButtonProps, Menu, MenuButton, Portal } from "@chakra-ui/core";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { forwardRef, Ref } from "react";
import { PetitionFieldTypeSelectDropdown } from "./PetitionFieldTypeSelect";

export type AddFieldPopoverProps = ButtonProps & {
  onSelectFieldType: (type: PetitionFieldType) => void;
};

export const AddFieldPopover = forwardRef(function AddFieldPopover(
  { onSelectFieldType, ...props }: AddFieldPopoverProps,
  ref: Ref<HTMLButtonElement>
) {
  return (
    <Menu placement="bottom">
      <MenuButton as={Button} ref={ref} {...props} />
      <Portal>
        <PetitionFieldTypeSelectDropdown
          onSelectFieldType={onSelectFieldType}
        />
      </Portal>
    </Menu>
  );
});
