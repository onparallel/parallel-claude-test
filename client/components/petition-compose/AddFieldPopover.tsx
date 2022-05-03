import { gql } from "@apollo/client";
import { Menu, MenuButton, MenuProps, Portal } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { AddFieldPopover_UserFragment, PetitionFieldType } from "@parallel/graphql/__types";
import { PetitionFieldTypeSelectDropdown } from "./PetitionFieldTypeSelectDropdown";

export interface AddFieldPopoverProps extends Pick<MenuProps, "onOpen" | "onClose"> {
  user: AddFieldPopover_UserFragment;
  onSelectFieldType: (type: PetitionFieldType) => void;
}

export const AddFieldPopover = Object.assign(
  chakraForwardRef<"button", AddFieldPopoverProps>(function AddFieldPopover(
    { id, user, onSelectFieldType, onOpen, onClose, ...props },
    ref
  ) {
    return (
      <Menu id={id} placement="bottom" onOpen={onOpen} onClose={onClose}>
        <MenuButton ref={ref} {...props} />
        <Portal>
          <PetitionFieldTypeSelectDropdown
            showDescription
            showHeader
            onSelectFieldType={onSelectFieldType}
            user={user}
          />
        </Portal>
      </Menu>
    );
  }),
  {
    fragments: {
      User: gql`
        fragment AddFieldPopover_User on User {
          ...PetitionFieldTypeSelectDropdown_User
        }
        ${PetitionFieldTypeSelectDropdown.fragments.User}
      `,
    },
  }
);
