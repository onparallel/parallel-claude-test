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
import { PetitionLocale } from "@parallel/graphql/__types";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { ValueProps } from "@parallel/utils/ValueProps";
import { FormattedMessage } from "react-intl";

interface NewPetitionLanguageFilterProps extends ValueProps<PetitionLocale> {}

export const NewPetitionLanguageFilter = chakraForwardRef<"button", NewPetitionLanguageFilterProps>(
  function NewPetitionLanguageFilter({ value, onChange, ...props }, ref) {
    const locales = useSupportedLocales();

    return (
      <Menu matchWidth={true}>
        <MenuButton
          ref={ref}
          as={Button}
          variant="outline"
          rightIcon={<ChevronDownIcon />}
          {...props}
        >
          {locales.find((l) => l.key === value)?.localizedLabel ?? (
            <FormattedMessage
              id="component.new-petition-language-filter.all"
              defaultMessage="All languages"
            />
          )}
        </MenuButton>
        <Portal>
          <MenuList minWidth="154px">
            <MenuOptionGroup
              value={value ?? "all"}
              onChange={(value) => onChange(value === "all" ? null : (value as PetitionLocale))}
            >
              <MenuItemOption value="all">
                <FormattedMessage
                  id="component.new-petition-language-filter.all"
                  defaultMessage="All languages"
                />
              </MenuItemOption>
              {locales.map((locale) => (
                <MenuItemOption key={locale.key} value={locale.key}>
                  {locale.localizedLabel}
                </MenuItemOption>
              ))}
            </MenuOptionGroup>
          </MenuList>
        </Portal>
      </Menu>
    );
  }
);
