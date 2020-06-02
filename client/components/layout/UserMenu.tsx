import { useApolloClient } from "@apollo/react-hooks";
import {
  Avatar,
  Button,
  Icon,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuOptionGroup,
  MenuItemOption,
} from "@chakra-ui/core";
import { UserMenu_UserFragment } from "@parallel/graphql/__types";
import { postJson } from "@parallel/utils/rest";
import { gql } from "apollo-boost";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink } from "../common/Link";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";

export interface UserMenuProps {
  isMobile?: boolean;
  user: UserMenu_UserFragment;
  onLocaleChange?: (locale: string) => void;
}

export function UserMenu({ isMobile, user, onLocaleChange }: UserMenuProps) {
  const intl = useIntl();
  const router = useRouter();
  const apollo = useApolloClient();

  async function handleLogoutClick() {
    await postJson("/api/auth/logout");
    localStorage.removeItem("token");
    await apollo.clearStore();
    router.push("/[locale]/login", `/${router.query.locale}/login`);
  }
  const locales = useSupportedLocales();

  return (
    <Menu>
      <MenuButton
        as={Button}
        {...{
          "aria-label": intl.formatMessage({
            id: "header.user-menu-button",
            defaultMessage: "User menu",
          }),
          rounded: "100%",
          height: 12,
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        <Avatar name={user.fullName!} size="md"></Avatar>
      </MenuButton>
      <MenuList placement={isMobile ? "top-end" : "right-end"}>
        <NakedLink href="/app/settings/account">
          <MenuItem as="a">
            <Icon name="user" marginRight={2} />
            <FormattedMessage
              id="component.user-menu.my-account"
              defaultMessage="My Account"
            />
          </MenuItem>
        </NakedLink>
        {isMobile ? (
          <MenuOptionGroup
            value={router.query.locale}
            title={intl.formatMessage({
              id: "component.user-menu.ui-language",
              defaultMessage: "Language",
            })}
            onChange={onLocaleChange as any}
            type="radio"
          >
            {locales.map(({ key, localizedLabel }) => (
              <MenuItemOption key={key} value={key}>
                {localizedLabel}
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        ) : null}
        <MenuDivider />
        <MenuItem onClick={handleLogoutClick}>
          <Icon name="log-out" marginRight={2} />
          <FormattedMessage
            id="component.user-menu.log-out"
            defaultMessage="Log out"
          />
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

UserMenu.fragments = {
  User: gql`
    fragment UserMenu_User on User {
      fullName
    }
  `,
};
