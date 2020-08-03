import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Flex,
  IconButton,
  List,
  ListItem,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Tooltip,
  useColorMode,
} from "@chakra-ui/core";
import {
  AddIcon,
  FileTextIcon,
  GlobeIcon,
  InfoOutlineIcon,
  PaperPlaneIcon,
  UsersIcon,
} from "@parallel/chakra/icons";
import { AppLayoutNavbar_UserFragment } from "@parallel/graphql/__types";
import { resolveUrl } from "@parallel/utils/next";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { useRouter } from "next/router";
import { memo, useMemo } from "react";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import { Logo } from "../common/Logo";
import { Spacer } from "../common/Spacer";
import { AppLayoutNavbarLink } from "./AppLayoutNavbarLink";
import { UserMenu } from "./UserMenu";

export type AppLayoutNavbarProps = BoxProps & {
  isMobile?: boolean;
  user: AppLayoutNavbar_UserFragment;
  onCreate: () => void;
  onOnboardingClick: () => void;
};

export const AppLayoutNavbar = Object.assign(
  memo(function AppLayoutNavbar({
    isMobile,
    user,
    onCreate,
    onOnboardingClick,
    ...props
  }: AppLayoutNavbarProps) {
    const { colorMode } = useColorMode();
    const { pathname } = useRouter();
    const intl = useIntl();
    const router = useRouter();
    const items = useMemo(
      () => [
        {
          section: "petitions",
          icon: <PaperPlaneIcon />,
          available: true,
          text: intl.formatMessage({
            id: "navbar.petitions-link",
            defaultMessage: "Petitions",
          }),
        },
        {
          section: "templates",
          icon: <FileTextIcon />,
          available: false,
          text: intl.formatMessage({
            id: "navbar.templates-link",
            defaultMessage: "Templates",
          }),
        },
        {
          section: "contacts",
          icon: <UsersIcon />,
          available: true,
          text: intl.formatMessage({
            id: "navbar.contacts-link",
            defaultMessage: "Contacts",
          }),
        },
      ],
      [intl.locale]
    );
    const locales = useSupportedLocales();
    function handleLocaleChange(locale: string) {
      router.push(
        router.pathname,
        resolveUrl(router.pathname, {
          ...router.query,
          locale,
        })
      );
    }
    return (
      <Flex
        alignItems="stretch"
        as="nav"
        backgroundColor={{ light: "white", dark: "gray.900" }[colorMode]}
        {...(isMobile
          ? {
              flexDirection: "row",
              minHeight: 16,
              height: 16,
              boxShadow:
                "0 -4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);",
              paddingX: 2,
            }
          : {
              flexDirection: "column",
              minWidth: 24,
              paddingTop: 6,
              paddingBottom: 4,
              boxShadow: "md",
            })}
        {...props}
      >
        {isMobile ? null : (
          <Flex justifyContent="center" marginBottom={6}>
            <NakedLink href="/app">
              <Box as="a" width="40px" height="40px" position="relative">
                <Box
                  position="absolute"
                  cursor="pointer"
                  transition="transform 150ms"
                  _hover={{
                    color: {
                      light: "gray.900",
                      dark: "purple.200",
                    }[colorMode],
                    transform: "scale(1.1)",
                  }}
                >
                  <Logo width={40} hideText={true} />
                </Box>
              </Box>
            </NakedLink>
          </Flex>
        )}
        <Flex justifyContent="center" alignItems="center">
          <IconButtonWithTooltip
            id="new-petition-button"
            colorScheme="purple"
            icon={<AddIcon />}
            size="lg"
            isRound
            onClick={onCreate}
            label={intl.formatMessage({
              id: "navbar.new-button",
              defaultMessage: "Create a new petition",
            })}
            placement={isMobile ? "top" : "right"}
          />
        </Flex>
        <List
          as={Flex}
          alignSelf="stretch"
          {...(isMobile
            ? {
                flex: 1,
                flexDirection: "row",
                justifyContent: "center",
                marginX: 2,
              }
            : {
                flexDirection: "column",
                marginY: 2,
              })}
        >
          {items.map(({ section, available, icon, text }) => (
            <ListItem key={section}>
              <AppLayoutNavbarLink
                href={`/app/${section}`}
                isAvailable={available}
                active={pathname.startsWith(`/[locale]/app/${section}`)}
                icon={icon}
                isMobile={isMobile}
              >
                {text}
              </AppLayoutNavbarLink>
            </ListItem>
          ))}
        </List>
        {isMobile ? (
          <Flex justifyContent="center" alignItems="center">
            <UserMenu
              user={user}
              isMobile
              onLocaleChange={handleLocaleChange}
            />
          </Flex>
        ) : (
          <>
            <Spacer />
            <Stack>
              <Flex justifyContent="center">
                <Menu placement="right">
                  <Tooltip
                    label={intl.formatMessage({
                      id: "navbar.change-language",
                      defaultMessage: "Change language",
                    })}
                    placement="right"
                  >
                    <MenuButton
                      as={IconButton}
                      aria-label={intl.formatMessage({
                        id: "navbar.change-language",
                        defaultMessage: "Change language",
                      })}
                      icon={<GlobeIcon />}
                      variant="ghost"
                      placement="right"
                      isRound
                    />
                  </Tooltip>
                  <Portal>
                    <MenuList>
                      {locales.map(({ key, localizedLabel }) => (
                        <MenuItem
                          as="button"
                          key={key}
                          onClick={() => handleLocaleChange(key)}
                          fontWeight={
                            router.query.locale === key ? "bold" : "normal"
                          }
                        >
                          {localizedLabel}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Portal>
                </Menu>
              </Flex>
              <Flex justifyContent="center">
                <IconButtonWithTooltip
                  label={intl.formatMessage({
                    id: "navbar.start-tour",
                    defaultMessage: "Guide me around",
                  })}
                  icon={<InfoOutlineIcon />}
                  variant="ghost"
                  placement="right"
                  isRound
                  onClick={onOnboardingClick}
                />
              </Flex>
              <Flex justifyContent="center" alignItems="center">
                <UserMenu user={user} />
              </Flex>
            </Stack>
          </>
        )}
      </Flex>
    );
  }),
  {
    fragments: {
      User: gql`
        fragment AppLayoutNavbar_User on User {
          ...UserMenu_User
        }
        ${UserMenu.fragments.User}
      `,
    },
  }
);
