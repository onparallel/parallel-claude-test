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
import { PetitionLocale } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { useIntl } from "react-intl";

export interface NewPetitionLanguageFilterProps extends MenuButtonProps {
  locale: Maybe<PetitionLocale>;
  onFilterChange: (args: Maybe<PetitionLocale>) => void;
}

export function NewPetitionLanguageFilter({
  locale,
  onFilterChange,
  ...props
}: NewPetitionLanguageFilterProps) {
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
        {locales.find((l) => l.key === locale)?.localizedLabel ??
          locales[0].localizedLabel}
      </MenuButton>
      <Portal>
        <MenuList>
          <MenuOptionGroup value={locale ?? "all"}>
            {locales.map((locale) => (
              <MenuItemOption
                key={locale.key}
                value={locale.key}
                onClick={() =>
                  onFilterChange(
                    locale.key === "all" ? null : (locale.key as PetitionLocale)
                  )
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
