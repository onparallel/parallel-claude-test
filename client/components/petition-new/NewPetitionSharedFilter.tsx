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
import { useSimpleSelectOptions } from "../common/SimpleSelect";

export type NewPetitionSharedFilterValues = "IS_OWNER" | "NOT_IS_OWNER";

interface NewPetitionSharedFilterProps extends ValueProps<NewPetitionSharedFilterValues> {}

export const NewPetitionSharedFilter = chakraForwardRef<"button", NewPetitionSharedFilterProps>(
  function NewPetitionSharedFilter({ value, onChange, ...props }, ref) {
    const options = useSimpleSelectOptions(
      (intl) => [
        {
          value: "ALL",
          label: intl.formatMessage({
            id: "component.new-petition-shared-filter.all",
            defaultMessage: "All templates",
          }),
        },
        {
          value: "IS_OWNER",
          label: intl.formatMessage({
            id: "component.new-petition-shared-filter.created-by-me",
            defaultMessage: "Created by me",
          }),
        },
        {
          value: "NOT_IS_OWNER",
          label: intl.formatMessage({
            id: "component.new-petition-shared-filter.shared-with-me",
            defaultMessage: "Shared with me",
          }),
        },
      ],
      []
    );

    return (
      <Menu matchWidth={true}>
        <MenuButton
          ref={ref}
          as={Button}
          variant="outline"
          rightIcon={<ChevronDownIcon />}
          {...props}
        >
          {options.find((opt) => opt.value === value)?.label ?? options[0].label}
        </MenuButton>
        <Portal>
          <MenuList minWidth="154px">
            <MenuOptionGroup
              value={value ?? "ALL"}
              onChange={(value) =>
                onChange(value === "ALL" ? null : (value as NewPetitionSharedFilterValues))
              }
            >
              {options.map((option) => (
                <MenuItemOption key={option.value} value={option.value}>
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
