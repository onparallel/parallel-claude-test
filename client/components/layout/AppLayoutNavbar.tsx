import { gql } from "@apollo/client";
import { Box, Flex, List, ListItem, Stack } from "@chakra-ui/core";
import {
  AddIcon,
  FileTextIcon,
  InfoOutlineIcon,
  PaperPlaneIcon,
  UsersIcon,
} from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import { AppLayoutNavbar_UserFragment } from "@parallel/graphql/__types";
import { resolveUrl } from "@parallel/utils/next";
import { useRouter } from "next/router";
import { memo, useMemo } from "react";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import { Logo } from "../common/Logo";
import { Spacer } from "../common/Spacer";
import { AppLayoutNavbarLink } from "./AppLayoutNavbarLink";
import { UserMenu } from "./UserMenu";

export type AppLayoutNavbarProps = ExtendChakra<{
  isMobile?: boolean;
  user: AppLayoutNavbar_UserFragment;
  onOnboardingClick: () => void;
}>;

export const AppLayoutNavbar = Object.assign(
  memo(function AppLayoutNavbar({
    isMobile,
    user,
    onOnboardingClick,
    ...props
  }: AppLayoutNavbarProps) {
    const { pathname, query } = useRouter();
    const intl = useIntl();
    const router = useRouter();
    const items = useMemo(
      () => [
        {
          section: "petitions",
          href: "/app/petitions",
          icon: <PaperPlaneIcon />,
          isActive:
            pathname.startsWith("/[locale]/app/petitions") &&
            query.type !== "TEMPLATE",
          text: intl.formatMessage({
            id: "navbar.petitions-link",
            defaultMessage: "Petitions",
          }),
        },
        {
          section: "templates",
          href: "/app/petitions?type=TEMPLATE",
          icon: <FileTextIcon />,
          isActive:
            pathname === "/[locale]/app/petitions" && query.type === "TEMPLATE",
          text: intl.formatMessage({
            id: "navbar.templates-link",
            defaultMessage: "Templates",
          }),
        },
        {
          section: "contacts",
          href: "/app/contacts",
          icon: <UsersIcon />,
          isActive: pathname.startsWith("/[locale]/app/contacts"),
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
        backgroundColor="white"
        {...(isMobile
          ? {
              display: { base: "flex", sm: "none" },
              flexDirection: "row",
              minHeight: 16,
              height: 16,
              boxShadow:
                "0 -4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);",
              paddingX: 2,
            }
          : {
              display: { base: "none", sm: "flex" },
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
          <NakedLink href="/app/petitions/new">
            <IconButtonWithTooltip
              id="new-petition-button"
              as={"a" as any}
              colorScheme="purple"
              icon={<AddIcon />}
              size="lg"
              isRound
              label={intl.formatMessage({
                id: "navbar.new-button",
                defaultMessage: "Create a new petition",
              })}
              placement={isMobile ? "top" : "right"}
            />
          </NakedLink>
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
          {items.map(({ section, href, isActive, icon, text }) => (
            <ListItem key={section} id={`pw-section-${section}`}>
              <AppLayoutNavbarLink
                href={href}
                isAvailable={true}
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
