import {
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuOptionGroup,
  MenuItemOption,
  MenuProps,
  MenuOptionGroupProps,
  Icon
} from "@chakra-ui/core";

import { FormattedMessage, useIntl } from "react-intl";

export type PetitionStatusFilterProps = Omit<MenuProps, "children"> &
  Pick<MenuOptionGroupProps, "value" | "onChange">;

export function PetitionStatusFilter({
  value,
  onChange,
  ...props
}: PetitionStatusFilterProps) {
  const intl = useIntl();
  const filters = {
    ALL: intl.formatMessage({
      id: "component.petition-status-filter.all",
      defaultMessage: "All petitions"
    }),
    DRAFT: intl.formatMessage({
      id: "component.petition-status-filter.draft",
      defaultMessage: "Draft"
    }),
    PENDING: intl.formatMessage({
      id: "component.petition-status-filter.pending",
      defaultMessage: "Pending"
    }),
    SCHEDULED: intl.formatMessage({
      id: "component.petition-status-filter.scheduled",
      defaultMessage: "Scheduled"
    }),
    COMPLETED: intl.formatMessage({
      id: "component.petition-status-filter.completed",
      defaultMessage: "Completed"
    })
  };
  return (
    <Menu {...props}>
      <MenuButton
        as={Button}
        {...{
          variant: "outline",
          leftIcon: value === "ALL" ? null : "filter",
          rightIcon: "chevron-down"
        }}
      >
        {filters[value as keyof typeof filters]}
      </MenuButton>
      <MenuList minWidth="200px">
        <MenuOptionGroup value={value} onChange={onChange} type="radio">
          <MenuItemOption value="ALL">{filters.ALL}</MenuItemOption>
          <MenuItemOption value="DRAFT">{filters.DRAFT}</MenuItemOption>
          <MenuItemOption value="PENDING">{filters.PENDING}</MenuItemOption>
          <MenuItemOption value="SCHEDULED">{filters.SCHEDULED}</MenuItemOption>
          <MenuItemOption value="COMPLETED">{filters.COMPLETED}</MenuItemOption>
        </MenuOptionGroup>
      </MenuList>
    </Menu>
  );
}
