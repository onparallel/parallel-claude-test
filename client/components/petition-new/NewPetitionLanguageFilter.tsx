import { gql } from "@apollo/client";
import { MenuButton, MenuItemOption, MenuList, MenuOptionGroup, Portal } from "@chakra-ui/react";
import { Button } from "@parallel/components/ui";
import { Menu } from "@parallel/chakra/components";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { NewPetitionLanguageFilter_UserFragment, PetitionLocale } from "@parallel/graphql/__types";
import { useAvailablePetitionLocales } from "@parallel/utils/locales";
import { ValueProps } from "@parallel/utils/ValueProps";
import { FormattedMessage } from "react-intl";

interface NewPetitionLanguageFilterProps extends ValueProps<PetitionLocale> {
  user: NewPetitionLanguageFilter_UserFragment;
}

export const NewPetitionLanguageFilter = chakraForwardRef<"button", NewPetitionLanguageFilterProps>(
  function NewPetitionLanguageFilter({ value, onChange, user, ...props }, ref) {
    const locales = useAvailablePetitionLocales(user);

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
  },
);

const _fragments = {
  User: gql`
    fragment NewPetitionLanguageFilter_User on User {
      ...useAvailablePetitionLocales_User
    }
  `,
};
