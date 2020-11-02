import { gql, useApolloClient } from "@apollo/client";
import {
  Avatar,
  Button,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
  UsePopperProps,
} from "@chakra-ui/core";
import { KeyIcon, LogOutIcon, UserIcon } from "@parallel/chakra/icons";
import { UserMenu_UserFragment } from "@parallel/graphql/__types";
import { postJson } from "@parallel/utils/rest";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink } from "../common/Link";

export interface UserMenuProps {
  placement?: UsePopperProps["placement"];
  user: UserMenu_UserFragment;
  onLocaleChange?: (locale: string) => void;
}

export function UserMenu({ placement, user, onLocaleChange }: UserMenuProps) {
  const intl = useIntl();
  const router = useRouter();
  const apollo = useApolloClient();

  async function handleLogoutClick() {
    await postJson("/api/auth/logout");
    localStorage.removeItem("token");
    await apollo.clearStore();
    router.push(`/${router.query.locale}/login`);
  }
  const locales = useSupportedLocales();
  const isAdmin =
    user.organization.identifier === "parallel" &&
    user.organizationRole === "ADMIN";

  return (
    <Menu placement={placement}>
      <MenuButton
        as={Button}
        aria-label={intl.formatMessage({
          id: "header.user-menu-button",
          defaultMessage: "User menu",
        })}
        borderRadius="full"
        height={12}
        paddingLeft={0}
        paddingRight={0}
      >
        <Avatar name={user.fullName!} size="md" />
      </MenuButton>
      <Portal>
        <MenuList>
          <NakedLink href="/app/settings">
            <MenuItem as="a">
              <UserIcon marginRight={2} />
              <FormattedMessage id="settings.title" defaultMessage="Settings" />
            </MenuItem>
          </NakedLink>
          {isAdmin ? (
            <NakedLink href="/app/admin">
              <MenuItem as="a">
                <KeyIcon marginRight={2} />
                <FormattedMessage
                  id="admin.title"
                  defaultMessage="Admin panel"
                />
              </MenuItem>
            </NakedLink>
          ) : null}
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
          <MenuDivider />
          <MenuItem onClick={handleLogoutClick}>
            <LogOutIcon marginRight={2} />
            <FormattedMessage
              id="component.user-menu.log-out"
              defaultMessage="Log out"
            />
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  );
}

UserMenu.fragments = {
  User: gql`
    fragment UserMenu_User on User {
      fullName
      organizationRole
      organization {
        identifier
      }
    }
  `,
};
