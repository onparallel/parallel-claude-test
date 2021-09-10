import { gql } from "@apollo/client";
import {
  Button,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
  useBreakpointValue,
  UsePopperProps,
} from "@chakra-ui/react";
import {
  BellIcon,
  BusinessIcon,
  CommentIcon,
  HelpOutlineIcon,
  KeyIcon,
  LogOutIcon,
  MapIcon,
  UserIcon,
} from "@parallel/chakra/icons";
import { UserMenu_UserFragment } from "@parallel/graphql/__types";
import { useNotificationsState } from "@parallel/utils/useNotificationsState";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink, NormalLink } from "../common/Link";
import { UserAvatar } from "../common/UserAvatar";

export interface UserMenuProps {
  placement?: UsePopperProps["placement"];
  user: UserMenu_UserFragment;
  onLocaleChange?: (locale: string) => void;
}

declare const zE: any;

export function UserMenu({ placement, user, onLocaleChange }: UserMenuProps) {
  const intl = useIntl();
  const router = useRouter();

  async function handleLogoutClick() {
    window.location.href = `/api/auth/logout`;
  }
  const locales = useSupportedLocales();

  const { query } = router;

  function handleHelpCenterClick() {
    (window as any).zE?.(function () {
      zE("webWidget", "setLocale", query.locale);
      zE.activate({ hideOnClose: true });
    });
  }

  const isMobile = useBreakpointValue({ base: true, sm: false });
  const { onOpen: onOpenNotifications } = useNotificationsState();

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
        <UserAvatar user={user} size="md" />
      </MenuButton>
      <Portal>
        <MenuList>
          {isMobile ? (
            <MenuItem onClick={onOpenNotifications} icon={<BellIcon display="block" boxSize={4} />}>
              <FormattedMessage
                id="component.user-menu.notifications"
                defaultMessage="Notifications"
              />
            </MenuItem>
          ) : null}
          <NakedLink href="/app/settings">
            <MenuItem as="a" icon={<UserIcon display="block" boxSize={4} />}>
              <FormattedMessage id="settings.title" defaultMessage="Settings" />
            </MenuItem>
          </NakedLink>
          <NakedLink href="/app/organization">
            <MenuItem as="a" icon={<BusinessIcon display="block" boxSize={4} />}>
              <FormattedMessage id="view.organization.title" defaultMessage="Organization" />
            </MenuItem>
          </NakedLink>
          {user.isSuperAdmin ? (
            <NakedLink href="/app/admin">
              <MenuItem as="a" icon={<KeyIcon display="block" boxSize={4} />}>
                <FormattedMessage id="admin.title" defaultMessage="Admin panel" />
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

          {isMobile ? (
            <MenuItem
              icon={<HelpOutlineIcon display="block" boxSize={4} />}
              onClick={handleHelpCenterClick}
            >
              <FormattedMessage id="navbar.help-center" defaultMessage="Help center" />
            </MenuItem>
          ) : null}
          <MenuItem data-action="start-tour" icon={<MapIcon display="block" boxSize={4} />}>
            <FormattedMessage id="navbar.start-tour" defaultMessage="Guide me around" />
          </MenuItem>
          <NormalLink
            href="https://airtable.com/shre0IJzqOWlZCrkf"
            aria-label="Feedback"
            isExternal
            color="inherit"
            _hover={{ color: "inherit" }}
          >
            <MenuItem icon={<CommentIcon display="block" boxSize={4} />}>
              <FormattedMessage id="navbar.give-feedback" defaultMessage="Give us your feedback" />
            </MenuItem>
          </NormalLink>
          <MenuDivider />

          <MenuItem onClick={handleLogoutClick} icon={<LogOutIcon display="block" boxSize={4} />}>
            <FormattedMessage id="component.user-menu.log-out" defaultMessage="Log out" />
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  );
}

UserMenu.fragments = {
  User: gql`
    fragment UserMenu_User on User {
      isSuperAdmin
      role
      ...UserAvatar_User
    }
    ${UserAvatar.fragments.User}
  `,
};
