import { gql } from "@apollo/client";
import {
  Button,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  useBreakpointValue,
  UsePopperProps,
  HStack,
  Text,
  Stack,
  Tooltip,
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
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink, NormalLink } from "../common/Link";
import { UserAvatar } from "../common/UserAvatar";

export interface UserMenuProps {
  placement?: UsePopperProps["placement"];
  user: UserMenu_UserFragment;
  onHelpCenterClick: () => void;
}

export function UserMenu({ placement, user, onHelpCenterClick }: UserMenuProps) {
  const intl = useIntl();
  const router = useRouter();

  async function handleLogoutClick() {
    window.location.href = `/api/auth/logout?${new URLSearchParams({
      locale: router.locale!,
    })}`;
  }

  const isMobile = useBreakpointValue({ base: true, sm: false });
  const { onOpen: onOpenNotifications } = useNotificationsState();

  return (
    <Menu placement={placement}>
      <Tooltip
        label={intl.formatMessage({
          id: "header.user-menu-button",
          defaultMessage: "User menu",
        })}
        placement="right"
      >
        <MenuButton
          as={Button}
          aria-label={intl.formatMessage({
            id: "header.user-menu-button",
            defaultMessage: "User menu",
          })}
          _hover={{
            shadow: "long",
            transform: "scale(1.1)",
          }}
          _active={{
            shadow: "long",
            transform: "scale(1.1)",
          }}
          borderRadius="full"
          height={12}
          paddingLeft={0}
          paddingRight={0}
          transition="all 200ms"
        >
          <UserAvatar user={user} size="md" />
        </MenuButton>
      </Tooltip>
      <Portal>
        <MenuList>
          <HStack paddingX={3.5} paddingY={1}>
            <UserAvatar user={user} size="sm" />
            <Stack spacing={0}>
              <Text as="div" fontWeight="semibold">
                {user.fullName}
              </Text>
              <Text as="div" color="gray.600" fontSize="sm">
                {user.email}
              </Text>
            </Stack>
          </HStack>

          <MenuDivider />

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
          <MenuDivider />

          {isMobile ? (
            <MenuItem
              icon={<HelpOutlineIcon display="block" boxSize={4} />}
              onClick={onHelpCenterClick}
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
      email
      ...UserAvatar_User
    }
    ${UserAvatar.fragments.User}
  `,
};
