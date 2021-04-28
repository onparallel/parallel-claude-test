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
  MenuGroup,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Tooltip,
} from "@chakra-ui/react";
import {
  AddIcon,
  FileNewIcon,
  FileTextIcon,
  HelpOutlineIcon,
  PaperPlaneIcon,
  PaperPlanesIcon,
  UsersIcon,
} from "@parallel/chakra/icons";
import { AppLayoutNavbar_UserFragment } from "@parallel/graphql/__types";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { resolveUrl } from "@parallel/utils/next";
import { withError } from "@parallel/utils/promises/withError";
import { useRouter } from "next/router";
import { memo, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink } from "../common/Link";
import { Logo } from "../common/Logo";
import { Spacer } from "../common/Spacer";
import { AppLayoutNavbarLink } from "./AppLayoutNavbarLink";
import { UserMenu } from "./UserMenu";

export interface AppLayoutNavbarProps extends BoxProps {
  isMobile?: boolean;
  user: AppLayoutNavbar_UserFragment;
  onOnboardingClick: () => void;
}

declare const zE: any;

export const AppLayoutNavbar = Object.assign(
  memo(function AppLayoutNavbar({
    isMobile,
    user,
    onOnboardingClick,
    ...props
  }: AppLayoutNavbarProps) {
    const intl = useIntl();
    const router = useRouter();
    const { pathname, query } = router;
    const createPetition = useCreatePetition();
    const goToPetition = useGoToPetition();
    const handleCreatePetition = useCallback(async () => {
      try {
        const petitionId = await createPetition();
        goToPetition(petitionId, "compose");
      } catch {}
    }, [createPetition, goToPetition]);
    const items = useMemo(
      () => [
        {
          section: "petitions",
          href: "/app/petitions",
          icon: <PaperPlaneIcon />,
          isAvailable: true,
          isActive: pathname.startsWith("/[locale]/app/petitions"),
          text: intl.formatMessage({
            id: "navbar.petitions-link",
            defaultMessage: "Petitions",
          }),
        },
        {
          section: "campaigns",
          icon: <PaperPlanesIcon />,
          isAvailable: false,
          text: intl.formatMessage({
            id: "navbar.campaigns-link",
            defaultMessage: "Campaigns",
          }),
        },
        {
          section: "contacts",
          href: "/app/contacts",
          icon: <UsersIcon />,
          isActive: pathname.startsWith("/[locale]/app/contacts"),
          isAvailable: true,
          text: intl.formatMessage({
            id: "navbar.contacts-link",
            defaultMessage: "Contacts",
          }),
        },
      ],
      [intl.locale, pathname, query]
    );
    function handleLocaleChange(locale: string) {
      router.push(
        resolveUrl(pathname, {
          ...query,
          locale,
        })
      );
    }

    function handleHelpCenterClick() {
      withError(
        zE(function () {
          zE("webWidget", "setLocale", query.locale);
          zE.activate({ hideOnClose: true });
        })
      );
    }
    return (
      <Flex
        alignItems="stretch"
        as="nav"
        backgroundColor="white"
        {...(isMobile
          ? {
              display: { base: "flex", sm: "none" },
              borderTop: "1px",
              borderTopColor: "gray.200",
              flexDirection: "row",
              minHeight: 16,
              height: 16,
              paddingX: 2,
            }
          : {
              display: { base: "none", sm: "flex" },
              borderRight: "1px",
              borderRightColor: "gray.200",
              boxShadow: "md",
              flexDirection: "column",
              minWidth: 24,
              paddingTop: 6,
              paddingBottom: 4,
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
                    color: "gray.900",
                    transform: "scale(1.1)",
                  }}
                >
                  <Logo width="40px" hideText={true} />
                </Box>
              </Box>
            </NakedLink>
          </Flex>
        )}
        <Flex justifyContent="center" alignItems="center">
          <Menu
            id="create-petition"
            placement={isMobile ? "top-start" : "right"}
          >
            <Tooltip
              label={intl.formatMessage({
                id: "navbar.create-new-petition",
                defaultMessage: "Create new petition",
              })}
              placement={isMobile ? "top" : "right"}
            >
              <MenuButton
                as={IconButton}
                colorScheme="purple"
                icon={<AddIcon />}
                size="lg"
                isRound
                aria-label={intl.formatMessage({
                  id: "navbar.create-new-petition",
                  defaultMessage: "Create new petition",
                })}
              />
            </Tooltip>
            <Portal>
              <MenuList>
                <MenuGroup
                  title={intl.formatMessage({
                    id: "navbar.create-new-petition",
                    defaultMessage: "Create new petition",
                  })}
                >
                  <NakedLink href="/app/petitions/new">
                    <MenuItem as="a">
                      <FileTextIcon marginRight={2} />
                      <FormattedMessage
                        id="navbar.create-new-petition-from-template"
                        defaultMessage="Use a template"
                      />
                    </MenuItem>
                  </NakedLink>
                  <MenuItem onClick={handleCreatePetition}>
                    <FileNewIcon marginRight={2} />
                    <FormattedMessage
                      id="navbar.create-new-petition-blank"
                      defaultMessage="Blank petition"
                    />
                  </MenuItem>
                </MenuGroup>
              </MenuList>
            </Portal>
          </Menu>
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
          {items.map(({ section, href, isActive, isAvailable, icon, text }) => (
            <ListItem key={section} id={`pw-section-${section}`}>
              <AppLayoutNavbarLink
                href={href}
                isAvailable={isAvailable}
                isActive={isActive}
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
              placement="top-end"
              onLocaleChange={handleLocaleChange}
            />
          </Flex>
        ) : (
          <>
            <Spacer />
            <Stack>
              <Menu id="help-menu" placement={isMobile ? "top-start" : "right"}>
                <Tooltip
                  label={intl.formatMessage({
                    id: "navbar.help-menu",
                    defaultMessage: "Help menu",
                  })}
                  placement={isMobile ? "top" : "right"}
                >
                  <Flex justifyContent="center" margin="auto">
                    <MenuButton
                      as={IconButton}
                      icon={<HelpOutlineIcon fontSize="20px" />}
                      isRound
                      variant="ghost"
                      aria-label={intl.formatMessage({
                        id: "navbar.help-menu",
                        defaultMessage: "Help menu",
                      })}
                    />
                  </Flex>
                </Tooltip>
                <Portal>
                  <MenuList>
                    <MenuGroup>
                      <MenuItem onClick={handleHelpCenterClick}>
                        <FormattedMessage
                          id="navbar.help-center"
                          defaultMessage="Help center"
                        />
                      </MenuItem>
                      <MenuItem onClick={onOnboardingClick}>
                        <FormattedMessage
                          id="navbar.start-tour"
                          defaultMessage="Guide me around"
                        />
                      </MenuItem>
                    </MenuGroup>
                  </MenuList>
                </Portal>
              </Menu>
              <Flex justifyContent="center" alignItems="center">
                <UserMenu
                  placement="right-end"
                  user={user}
                  onLocaleChange={handleLocaleChange}
                />
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
