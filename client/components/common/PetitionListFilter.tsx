import {
  Button,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
  MenuDivider,
} from "@chakra-ui/core";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { PetitionStatus } from "@parallel/graphql/__types";
import { useCallback } from "react";
import { useIntl } from "react-intl";

export type PetitionListFilterProps = {
  status: PetitionStatus | null;
  type: "PETITION" | "TEMPLATE";
  onChange: (value: PetitionStatus | null) => void;
};

export function PetitionListFilter({
  value,
  onChange,
  ...props
}: PetitionListFilterProps) {
  const intl = useIntl();
  const filters = {
    ALL: intl.formatMessage({
      id: "component.petition-list-filter.all",
      defaultMessage: "All petitions",
    }),
    DRAFT: intl.formatMessage({
      id: "component.petition-list-filter.draft",
      defaultMessage: "Draft",
    }),
    PENDING: intl.formatMessage({
      id: "component.petition-list-filter.pending",
      defaultMessage: "Pending",
    }),
    COMPLETED: intl.formatMessage({
      id: "component.petition-list-filter.completed",
      defaultMessage: "Completed",
    }),
    TEMPLATES: intl.formatMessage({
      id: "component.petition-list-filter.template",
      defaultMessage: "Templates",
    }),
  };
  const handleChange = useCallback(
    (value) => {
      onChange(value === "ALL" ? null : (value as PetitionStatus));
    },
    [onChange]
  );

  return (
    <Menu>
      <MenuButton as={Button} variant="outline" rightIcon={<ChevronDownIcon />}>
        {filters[value ?? "ALL"]}
      </MenuButton>
      <Portal>
        <MenuList minWidth="200px">
          <MenuOptionGroup
            value={value ?? "ALL"}
            onChange={handleChange}
            type="radio"
          >
            <MenuItemOption value="ALL">{filters.ALL}</MenuItemOption>
            <MenuItemOption value="DRAFT">{filters.DRAFT}</MenuItemOption>
            <MenuItemOption value="PENDING">{filters.PENDING}</MenuItemOption>
            <MenuItemOption value="COMPLETED">
              {filters.COMPLETED}
            </MenuItemOption>
            <MenuDivider />
            <MenuItemOption value="TEMPLATES">
              {filters.TEMPLATES}
            </MenuItemOption>
          </MenuOptionGroup>
        </MenuList>
      </Portal>
    </Menu>
  );
}
