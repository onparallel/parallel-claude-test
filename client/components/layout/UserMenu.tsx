import { gql } from "@apollo/client";
import {
  Box,
  Button,
  HStack,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  useBreakpointValue,
  UsePopperProps,
} from "@chakra-ui/react";
import { Menu, Tooltip } from "@parallel/chakra/components";
import {
  ArrowBackIcon,
  BellIcon,
  CommentIcon,
  EditIcon,
  KeyIcon,
  LogOutIcon,
  MapIcon,
  SettingsIcon,
} from "@parallel/chakra/icons";
import { UserMenu_QueryFragment } from "@parallel/graphql/__types";
import { useLoginAs } from "@parallel/utils/useLoginAs";
import { useNotificationsState } from "@parallel/utils/useNotificationsState";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink } from "../common/Link";
import { UserAvatar } from "../common/UserAvatar";
import { Avatar } from "../ui";
import { Text } from "@parallel/components/ui";

export interface UserMenuProps extends UserMenu_QueryFragment {
  placement?: UsePopperProps["placement"];
  extended?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export function UserMenu({ extended, placement, me, realMe, onToggle }: UserMenuProps) {
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
    <Menu placement={placement} onOpen={() => onToggle?.(true)} onClose={() => onToggle?.(false)}>
      <Tooltip
        label={intl.formatMessage({
          id: "component.user-menu.profile-and-organization",
          defaultMessage: "Account & Organization settings",
        })}
        placement={isMobile ? "bottom" : "right"}
        openDelay={isMobile ? 0 : 450}
      >
        {extended ? (
          <MenuButton
            className="user-menu-button"
            as={Button}
            variant="ghost"
            aria-label={intl.formatMessage({
              id: "component.user-menu.profile-and-organization",
              defaultMessage: "Account & Organization settings",
            })}
            data-testid="user-menu"
            data-action="open-user-menu"
            paddingY={2}
            paddingX={3}
            borderRadius={0}
            minHeight={0}
            height="auto"
            textAlign="start"
            width="100%"
          >
            <HStack>
              <UserAvatar user={me} boxSize="40px">
                {realMe && realMe.id !== me.id ? (
                  <Avatar.Badge bgColor="white">
                    <UserAvatar user={realMe} size="xs" />
                  </Avatar.Badge>
                ) : null}
              </UserAvatar>
              <Stack spacing={1} minWidth={0}>
                <Text
                  as="span"
                  fontWeight={500}
                  data-testid="account-name"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {me.fullName}
                </Text>
                <Text
                  as="span"
                  fontWeight={400}
                  color="gray.600"
                  fontSize="sm"
                  data-testid="account-email"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {me.email}
                </Text>
              </Stack>
            </HStack>
          </MenuButton>
        ) : (
          <MenuButton
            as={Button}
            aria-label={intl.formatMessage({
              id: "component.user-menu.profile-and-organization",
              defaultMessage: "Account & Organization settings",
            })}
            data-testid="user-menu"
            data-action="open-user-menu"
            borderRadius="full"
            paddingStart={0}
            paddingEnd={0}
            transition="all 200ms"
            boxSize="40px"
          >
            <UserAvatar user={me} boxSize="40px">
              {realMe && realMe.id !== me.id ? (
                <Avatar.Badge bgColor="white">
                  <UserAvatar user={realMe} size="xs" />
                </Avatar.Badge>
              ) : null}
            </UserAvatar>
          </MenuButton>
        )}
      </Tooltip>
      <Portal>
        <MenuList>
          <Box
            boxSize={1}
            position="absolute"
            bottom={0}
            insetEnd={0}
            aria-hidden
            cursor="crosshair"
            overflow="hidden"
            userSelect="none"
            opacity={0}
            onClick={() => {
              throw new Error("Debug");
            }}
          >
            {/* This is to test sentry errors */}
          </Box>
          <HStack paddingX={3.5} paddingY={1}>
            <UserAvatar user={me} size="sm" />
            <Stack spacing={0}>
              <Text as="div" fontWeight="semibold" data-testid="account-name">
                {me.fullName}
              </Text>
              <Text as="div" color="gray.600" fontSize="sm" data-testid="account-email">
                {me.email}
              </Text>
            </Stack>
          </HStack>

          <MenuDivider />
          {realMe && realMe.id !== me.id ? (
            <>
              <MenuItem
                icon={<ArrowBackIcon display="block" boxSize={4} />}
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
            <MenuItem as="a" icon={<EditIcon display="block" boxSize={4} />}>
              <FormattedMessage
                id="component.user-menu.edit-account"
                defaultMessage="Edit my account"
              />
            </MenuItem>
          </NakedLink>

          <NakedLink href="/app/organization">
            <MenuItem as="a" icon={<SettingsIcon display="block" boxSize={4} />}>
              <FormattedMessage id="page.organization.title" defaultMessage="Organization" />
            </MenuItem>
          </NakedLink>

          {realMe.isSuperAdmin ? (
            <NakedLink href="/app/admin">
              <MenuItem as="a" icon={<KeyIcon display="block" boxSize={4} />}>
                <FormattedMessage id="admin.title" defaultMessage="Admin panel" />
              </MenuItem>
            </NakedLink>
          ) : null}
          <MenuDivider />
          <MenuItem data-action="start-tour" icon={<MapIcon display="block" boxSize={4} />}>
            <FormattedMessage id="navbar.start-tour" defaultMessage="Guide me around" />
          </MenuItem>
          <MenuItem
            as="a"
            href="https://roadmap.onparallel.com/"
            target="_blank"
            rel="noopener"
            icon={<CommentIcon display="block" boxSize={4} />}
          >
            <FormattedMessage id="navbar.feature-requests" defaultMessage="Feature requests" />
          </MenuItem>
          <MenuDivider />

          <MenuItem onClick={handleLogoutClick} icon={<LogOutIcon display="block" boxSize={4} />}>
            <FormattedMessage id="component.user-menu.log-out" defaultMessage="Log out" />
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  );
}

const _fragments = {
  Query: gql`
    fragment UserMenu_Query on Query {
      me {
        id
        email
        ...UserAvatar_User
      }
      realMe {
        id
        isSuperAdmin
        ...UserAvatar_User
      }
    }
  `,
};
