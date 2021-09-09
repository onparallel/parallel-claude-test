import {
  Button,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ValueProps } from "@parallel/utils/ValueProps";
import { useMemo } from "react";
import { useIntl } from "react-intl";

export type NewPetitionSharedFilterValues = "IS_OWNER" | "NOT_IS_OWNER";

export interface NewPetitionSharedFilterProps extends ValueProps<NewPetitionSharedFilterValues> {}

export const NewPetitionSharedFilter = chakraForwardRef<"button", NewPetitionSharedFilterProps>(
  function NewPetitionSharedFilter({ value, onChange, ...props }, ref) {
    const intl = useIntl();
    const options = useMemo(
      () => [
        {
          key: "ALL",
          label: intl.formatMessage({
            id: "component.new-petition-shared-filter.all",
            defaultMessage: "All templates",
          }),
        },
        {
          key: "IS_OWNER",
          label: intl.formatMessage({
            id: "component.new-petition-shared-filter.created-by-me",
            defaultMessage: "Created by me",
          }),
        },
        {
          key: "NOT_IS_OWNER",
          label: intl.formatMessage({
            id: "component.new-petition-shared-filter.shared-with-me",
            defaultMessage: "Shared with me",
          }),
        },
      ],
      [intl.locale]
    );

    return (
      <Menu>
        <MenuButton
          ref={ref}
          as={Button}
          variant="outline"
          rightIcon={<ChevronDownIcon />}
          {...props}
        >
          {options.find((opt) => opt.key === value)?.label ?? options[0].label}
        </MenuButton>
        <Portal>
          <MenuList width="min-content" minWidth="154px" whiteSpace="nowrap">
            <MenuOptionGroup
              value={value ?? "ALL"}
              onChange={(value) =>
                onChange(value === "ALL" ? null : (value as NewPetitionSharedFilterValues))
              }
            >
              {options.map((option) => (
                <MenuItemOption key={option.key} value={option.key}>
                  {option.label}
                </MenuItemOption>
              ))}
            </MenuOptionGroup>
          </MenuList>
        </Portal>
      </Menu>
    );
  }
);
