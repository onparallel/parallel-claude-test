import { gql } from "@apollo/client";
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
} from "@chakra-ui/react";
import {
  BusinessIcon,
  KeyIcon,
  LogOutIcon,
  UserIcon,
} from "@parallel/chakra/icons";
import { UserMenu_UserFragment } from "@parallel/graphql/__types";
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

  async function handleLogoutClick() {
    window.location.href = `/api/auth/logout`;
  }
  const locales = useSupportedLocales();

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
            <MenuItem as="a" icon={<UserIcon display="block" boxSize={4} />}>
              <FormattedMessage id="settings.title" defaultMessage="Settings" />
            </MenuItem>
          </NakedLink>
          {user.role === "ADMIN" ? (
            <NakedLink href="/app/organization">
              <MenuItem
                as="a"
                icon={<BusinessIcon display="block" boxSize={4} />}
              >
                <FormattedMessage
                  id="view.organization.title"
                  defaultMessage="Organization"
                />
              </MenuItem>
            </NakedLink>
          ) : null}
          {user.isSuperAdmin ? (
            <NakedLink href="/app/admin">
              <MenuItem as="a" icon={<KeyIcon display="block" boxSize={4} />}>
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
          <MenuItem
            onClick={handleLogoutClick}
            icon={<LogOutIcon display="block" boxSize={4} />}
          >
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
      isSuperAdmin
      role
    }
  `,
};
