import {
  Button,
  Menu,
  MenuButton,
  MenuButtonProps,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { Maybe } from "@parallel/utils/types";
import { useMemo } from "react";
import { useIntl } from "react-intl";

export type NewPetitionSharedFilterValues = "IS_OWNER" | "NOT_IS_OWNER";

export interface NewPetitionSharedFilterProps extends MenuButtonProps {
  option: Maybe<NewPetitionSharedFilterValues>;
  onSharedFilterChange: (args: Maybe<NewPetitionSharedFilterValues>) => void;
}

export function NewPetitionSharedFilter({
  option,
  onSharedFilterChange,
  ...props
}: NewPetitionSharedFilterProps) {
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
        as={Button}
        variant="outline"
        rightIcon={<ChevronDownIcon />}
        {...props}
      >
        {options.find((opt) => opt.key === option)?.label ?? options[0].label}
      </MenuButton>
      <Portal>
        <MenuList width="min-content" minWidth="154px" whiteSpace="nowrap">
          <MenuOptionGroup value={option ?? "ALL"}>
            {options.map((option) => (
              <MenuItemOption
                key={option.key}
                value={option.key}
                onClick={() =>
                  onSharedFilterChange(
                    option.key === "ALL"
                      ? null
                      : (option.key as NewPetitionSharedFilterValues)
                  )
                }
              >
                {option.label}
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuList>
      </Portal>
    </Menu>
  );
}
