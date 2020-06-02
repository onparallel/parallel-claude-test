import {
  Box,
  BoxProps,
  Flex,
  List,
  ListItem,
  PseudoBox,
  useColorMode,
  IconButton,
  MenuList,
  MenuItem,
  Tooltip,
  useTheme,
  Stack,
} from "@chakra-ui/core";
import { AppLayoutNavbar_UserFragment } from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { useRouter } from "next/router";
import { useMemo, memo } from "react";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import { Logo } from "../common/Logo";
import { Spacer } from "../common/Spacer";
import { AppLayoutNavbarLink } from "./AppLayoutNavbarLink";
import { UserMenu } from "./UserMenu";
import { ButtonDropdown } from "../common/ButtonDropdown";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { resolveUrl } from "@parallel/utils/next";

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
    const theme = useTheme();
    const router = useRouter();
    const items = useMemo(
      () => [
        {
          section: "petitions",
          icon: "paper-plane",
          available: true,
          text: intl.formatMessage({
            id: "navbar.petitions-link",
            defaultMessage: "Petitions",
          }),
        },
        {
          section: "templates",
          icon: "file-text",
          available: false,
          text: intl.formatMessage({
            id: "navbar.templates-link",
            defaultMessage: "Templates",
          }),
        },
        {
          section: "contacts",
          icon: "users",
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
              shadow:
                "0 -4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);",
              paddingX: 1,
            }
          : {
              flexDirection: "column",
              minWidth: 24,
              paddingY: 4,
              shadow: "md",
            })}
        {...props}
      >
        {isMobile ? null : (
          <Flex justifyContent="center" marginTop={6} marginBottom={6}>
            <NakedLink href="/app">
              <Box as="a" width="40px" height="40px" position="relative">
                <PseudoBox
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
                  <Logo width={40} hideText={true}></Logo>
                </PseudoBox>
              </Box>
            </NakedLink>
          </Flex>
        )}
        <Flex justifyContent="center" alignItems="center">
          <IconButtonWithTooltip
            id="new-petition-button"
            variantColor="purple"
            icon="add"
            size="lg"
            isRound
            onClick={onCreate}
            showDelay={300}
            label={intl.formatMessage({
              id: "navbar.new-button",
              defaultMessage: "Create a new petition",
            })}
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
                marginX: 1,
              }
            : {
                flexDirection: "column",
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
                <Tooltip
                  zIndex={theme.zIndices.tooltip}
                  showDelay={300}
                  aria-label={intl.formatMessage({
                    id: "navbar.change-language",
                    defaultMessage: "Change language",
                  })}
                  label={intl.formatMessage({
                    id: "navbar.change-language",
                    defaultMessage: "Change language",
                  })}
                >
                  <ButtonDropdown
                    as={IconButton}
                    aria-label={intl.formatMessage({
                      id: "navbar.change-language",
                      defaultMessage: "Change language",
                    })}
                    icon={"globe" as any}
                    variant="ghost"
                    isRound
                    dropdown={
                      <MenuList placement="right">
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
                    }
                  />
                </Tooltip>
              </Flex>
              <Flex justifyContent="center">
                <IconButtonWithTooltip
                  showDelay={300}
                  label={intl.formatMessage({
                    id: "navbar.start-tour",
                    defaultMessage: "Guide me around",
                  })}
                  icon="info-outline"
                  variant="ghost"
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
