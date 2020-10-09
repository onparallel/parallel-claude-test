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
import { PetitionStatus, PetitionBaseType } from "@parallel/graphql/__types";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { Maybe } from "@parallel/utils/types";

export type PetitionListFilterProps = {
  status: Maybe<PetitionStatus>;
  type: PetitionBaseType;
  onFilterChange: (value: {
    type: PetitionBaseType;
    status: Maybe<PetitionStatus>;
  }) => void;
};

export function PetitionListFilter({
  status,
  type,
  onFilterChange,
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
    CLOSED: intl.formatMessage({
      id: "component.petition-list-filter.closed",
      defaultMessage: "Closed",
    }),
    TEMPLATE: intl.formatMessage({
      id: "component.petition-list-filter.template",
      defaultMessage: "Templates",
    }),
  };
  const value = type === "TEMPLATE" ? "TEMPLATE" : status ?? "ALL";

  const handleChange = useCallback(
    (val: typeof value) => {
      onFilterChange(
        val === "TEMPLATE"
          ? { type: "TEMPLATE", status: null }
          : { type: "PETITION", status: val === "ALL" ? null : val }
      );
    },
    [onFilterChange]
  );

  return (
    <Menu>
      <MenuButton as={Button} variant="outline" rightIcon={<ChevronDownIcon />}>
        {filters[value ?? "ALL"]}
      </MenuButton>
      <Portal>
        <MenuList minWidth="200px">
          <MenuOptionGroup
            value={value}
            onChange={handleChange as any}
            type="radio"
          >
            <MenuItemOption value="ALL">{filters.ALL}</MenuItemOption>
            <MenuItemOption value="DRAFT">{filters.DRAFT}</MenuItemOption>
            <MenuItemOption value="PENDING">{filters.PENDING}</MenuItemOption>
            <MenuItemOption value="COMPLETED">
              {filters.COMPLETED}
            </MenuItemOption>
            <MenuItemOption value="CLOSED">{filters.CLOSED}</MenuItemOption>
            <MenuDivider />
            <MenuItemOption value="TEMPLATE">{filters.TEMPLATE}</MenuItemOption>
          </MenuOptionGroup>
        </MenuList>
      </Portal>
    </Menu>
  );
}
