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
import { usePublicTemplateCategories } from "@parallel/utils/usePublicTemplateCategories";
import { ValueProps } from "@parallel/utils/ValueProps";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";

interface NewPetitionCategoryMenuFilterProps extends ValueProps<string> {
  categories: string[];
}

export const NewPetitionCategoryMenuFilter = chakraForwardRef<
  "button",
  NewPetitionCategoryMenuFilterProps
>(function NewPetitionCategoryMenuFilter({ value, onChange, categories, ...props }, ref) {
  const intl = useIntl();

  const allCategories = usePublicTemplateCategories();

  const defaultOption = {
    label: intl.formatMessage({
      id: "generic.all-categories",
      defaultMessage: "All categories",
    }),
    slug: "all",
  };

  const options = [
    defaultOption,
    ...categories.map((value) => allCategories.find((c) => c.slug === value)).filter(isDefined),
  ];

  const selectedOption = options.find((o) => o.slug === value) ?? defaultOption;

  return (
    <Menu matchWidth={true}>
      <MenuButton
        as={Button}
        ref={ref}
        variant="outline"
        rightIcon={<ChevronDownIcon />}
        {...props}
      >
        {selectedOption?.label}
      </MenuButton>
      <Portal>
        <MenuList minWidth="154px" whiteSpace="nowrap">
          <MenuOptionGroup
            value={value ?? "all"}
            onChange={(value) => onChange(value === "all" ? null : (value as string))}
          >
            {options.map((option) => (
              <MenuItemOption key={option.slug} value={option.slug}>
                {option.label}
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuList>
      </Portal>
    </Menu>
  );
});
