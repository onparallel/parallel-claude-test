import { MenuButton, MenuItemOption, MenuList, MenuOptionGroup, Portal } from "@chakra-ui/react";
import { Button } from "@parallel/components/ui";
import { Menu } from "@parallel/chakra/components";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { usePublicTemplateCategories } from "@parallel/utils/usePublicTemplateCategories";
import { ValueProps } from "@parallel/utils/ValueProps";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";

interface NewPetitionCategoryMenuFilterProps extends ValueProps<string> {
  categories: string[];
}

export const NewPetitionCategoryMenuFilter = chakraComponent<
  "button",
  NewPetitionCategoryMenuFilterProps
>(function NewPetitionCategoryMenuFilter({ ref, value, onChange, categories, ...props }) {
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
    ...categories.map((value) => allCategories.find((c) => c.slug === value)).filter(isNonNullish),
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
