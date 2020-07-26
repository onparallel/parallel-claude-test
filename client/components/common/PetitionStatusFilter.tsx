import {
  Button,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
} from "@chakra-ui/core";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { PetitionStatus } from "@parallel/graphql/__types";
import { useCallback } from "react";
import { useIntl } from "react-intl";

export type PetitionStatusFilterProps = {
  value: PetitionStatus | null;
  onChange: (value: PetitionStatus | null) => void;
};

export function PetitionStatusFilter({
  value,
  onChange,
  ...props
}: PetitionStatusFilterProps) {
  const intl = useIntl();
  const filters = {
    ALL: intl.formatMessage({
      id: "component.petition-status-filter.all",
      defaultMessage: "All petitions",
    }),
    DRAFT: intl.formatMessage({
      id: "component.petition-status-filter.draft",
      defaultMessage: "Draft",
    }),
    PENDING: intl.formatMessage({
      id: "component.petition-status-filter.pending",
      defaultMessage: "Pending",
    }),
    COMPLETED: intl.formatMessage({
      id: "component.petition-status-filter.completed",
      defaultMessage: "Completed",
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
          </MenuOptionGroup>
        </MenuList>
      </Portal>
    </Menu>
  );
}
