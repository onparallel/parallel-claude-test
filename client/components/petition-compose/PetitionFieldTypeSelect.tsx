import { gql } from "@apollo/client";
import { MenuButton, Portal, ThemingProps } from "@chakra-ui/react";
import { Menu } from "@parallel/chakra/components";
import { chakraComponent } from "@parallel/chakra/utils";
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
  isFieldGroupChild?: boolean;
}

export const PetitionFieldTypeSelect = chakraComponent<"button", PetitionFieldTypeSelectProps>(
  function PetitionFieldTypeSelect({ ref, user, type, onChange, isFieldGroupChild, ...props }) {
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
            isFieldGroupChild={isFieldGroupChild}
          />
        </Portal>
      </Menu>
    );
  },
);

const _fragments = {
  User: gql`
    fragment PetitionFieldTypeSelect_User on User {
      ...PetitionFieldTypeSelectDropdown_User
    }
  `,
};
