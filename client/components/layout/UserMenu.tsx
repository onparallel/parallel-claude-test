import { gql } from "@apollo/client";
import {
  AvatarBadge,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Text,
  Tooltip,
  useBreakpointValue,
  UsePopperProps,
} from "@chakra-ui/react";
import {
  BellIcon,
  BusinessIcon,
  CommentIcon,
  HelpOutlineIcon,
  KeyIcon,
  LogInIcon,
  LogOutIcon,
  MapIcon,
  UserIcon,
} from "@parallel/chakra/icons";
import { UserMenu_QueryFragment } from "@parallel/graphql/__types";
import { useLoginAs } from "@parallel/utils/useLoginAs";
import { useNotificationsState } from "@parallel/utils/useNotificationsState";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink, NormalLink } from "../common/Link";
import { UserAvatar } from "../common/UserAvatar";

export interface UserMenuProps extends UserMenu_QueryFragment {
  placement?: UsePopperProps["placement"];
  onHelpCenterClick: () => void;
}

export function UserMenu({ placement, me, realMe, onHelpCenterClick }: UserMenuProps) {
  const intl = useIntl();
  const router = useRouter();

  async function handleLogoutClick() {
    window.location.href = `/api/auth/logout?${new URLSearchParams({
      locale: router.locale!,
    })}`;
  }

  const isMobile = useBreakpointValue({ base: true, sm: false });
  const { onOpen: onOpenNotifications } = useNotificationsState();

  const loginAs = useLoginAs();
  const handleRestoreLogin = async () => {
    await loginAs(null);
  };

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
          <UserAvatar user={me} size="md">
            {realMe ? (
              <AvatarBadge bgColor="white">
                <UserAvatar user={realMe} size="xs" />
              </AvatarBadge>
            ) : null}
          </UserAvatar>
        </MenuButton>
      </Tooltip>
      <Portal>
        <MenuList>
          <HStack paddingX={3.5} paddingY={1}>
            <UserAvatar user={me} size="sm" />
            <Stack spacing={0}>
              <Text as="div" fontWeight="semibold">
                {me.fullName}
              </Text>
              <Text as="div" color="gray.600" fontSize="sm">
                {me.email}
              </Text>
            </Stack>
          </HStack>

          <MenuDivider />
          {realMe ? (
            <>
              <MenuItem
                icon={<LogInIcon display="block" boxSize={4} />}
                onClick={handleRestoreLogin}
              >
                <Text>
                  <FormattedMessage
                    id="component.user-menu.back-to-account"
                    defaultMessage="Back to my account"
                  />
                </Text>
                <Text color="gray.600" fontSize="sm">
                  <FormattedMessage
                    id="component.user-menu.login-from-user"
                    defaultMessage="Login from {user}"
                    values={{
                      user: realMe.fullName,
                    }}
                  />
                </Text>
              </MenuItem>
              <MenuDivider />
            </>
          ) : null}

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

          {me.isSuperAdmin ? (
            <NakedLink href="/app/admin">
              <MenuItem as="a" icon={<KeyIcon display="block" boxSize={4} />}>
                <FormattedMessage id="admin.title" defaultMessage="Admin panel" />
              </MenuItem>
            </NakedLink>
          ) : null}
          <MenuDivider />

          {isMobile ? (
            <MenuItem
              as="a"
              href={`https://help.onparallel.com/${intl.locale}`}
              target="_blank"
              rel="noopener"
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
  Query: gql`
    fragment UserMenu_Query on Query {
      me {
        isSuperAdmin
        role
        email
        ...UserAvatar_User
      }
      realMe {
        id
        ...UserAvatar_User
      }
    }
    ${UserAvatar.fragments.User}
  `,
};
