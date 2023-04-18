import { gql } from "@apollo/client";
import { Menu, MenuButton, Portal, ThemingProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldType, PetitionFieldTypeSelect_UserFragment } from "@parallel/graphql/__types";
import { SelectLikeButton } from "../common/SelectLikeButton";
import { PetitionFieldTypeLabel } from "./PetitionFieldTypeLabel";
import { PetitionFieldTypeSelectDropdown } from "./PetitionFieldTypeSelectDropdown";

interface PetitionFieldTypeSelectProps extends ThemingProps<"Select"> {
  isDisabled?: boolean;
  user: PetitionFieldTypeSelect_UserFragment;
  type: PetitionFieldType;
  onChange: (type: PetitionFieldType) => void;
  isReadOnly?: boolean;
}

export const PetitionFieldTypeSelect = Object.assign(
  chakraForwardRef<"button", PetitionFieldTypeSelectProps>(function PetitionFieldTypeSelect(
    { user, type, onChange, ...props },
    ref
  ) {
    return (
      <Menu placement="bottom" gutter={2}>
        <MenuButton as={SelectLikeButton} ref={ref} {...(props as any)}>
          <PetitionFieldTypeLabel type={type} display="flex" />
        </MenuButton>
        <Portal>
          <PetitionFieldTypeSelectDropdown
            onSelectFieldType={onChange}
            role="listbox"
            user={user}
          />
        </Portal>
      </Menu>
    );
  }),
  {
    fragments: {
      User: gql`
        fragment PetitionFieldTypeSelect_User on User {
          ...PetitionFieldTypeSelectDropdown_User
        }
        ${PetitionFieldTypeSelectDropdown.fragments.User}
      `,
    },
  }
);
