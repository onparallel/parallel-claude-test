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
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { useIntl } from "react-intl";

export function NewPetitionLanguageFilter({ value, onFilterChange, ...props }) {
  const intl = useIntl();
  let locales = useSupportedLocales();

  locales = [
    {
      key: "all",
      label: "all languages",
      localizedLabel: intl.formatMessage({
        id: "component.new-petition-language-filter.all",
        defaultMessage: "All languages",
      }),
    },
    ...locales,
  ];

  return (
    <Menu>
      <MenuButton
        as={Button}
        variant="outline"
        rightIcon={<ChevronDownIcon />}
        {...props}
      >
        {locales.find((locale) => locale.key === value)?.localizedLabel ??
          locales[0].localizedLabel}
      </MenuButton>
      <Portal>
        <MenuList>
          <MenuOptionGroup value={value ?? "all"}>
            {locales.map((locale) => (
              <MenuItemOption
                key={locale.key}
                value={locale.key}
                onClick={() =>
                  onFilterChange(locale.key === "all" ? null : locale.key)
                }
              >
                {locale.localizedLabel}
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuList>
      </Portal>
    </Menu>
  );
}
