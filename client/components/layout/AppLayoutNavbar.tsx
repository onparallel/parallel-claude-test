import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Center,
  Flex,
  List,
  ListItem,
  Stack,
  useBreakpointValue,
} from "@chakra-ui/react";
import {
  AddIcon,
  HelpOutlineIcon,
  PaperPlaneIcon,
  PaperPlanesIcon,
  UsersIcon,
} from "@parallel/chakra/icons";
import { AppLayoutNavbar_UserFragment } from "@parallel/graphql/__types";
import { resolveUrl } from "@parallel/utils/next";
import { useRouter } from "next/router";
import { memo, useMemo } from "react";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import { Logo } from "../common/Logo";
import { Spacer } from "../common/Spacer";
import { NotificationsButton } from "../notifications/NotificationsButton";
import { AppLayoutNavbarLink } from "./AppLayoutNavbarLink";
import { UserMenu } from "./UserMenu";

export interface AppLayoutNavbarProps extends BoxProps {
  user: AppLayoutNavbar_UserFragment;
}

declare const zE: any;

export const AppLayoutNavbar = Object.assign(
  memo(function AppLayoutNavbar({ user, ...props }: AppLayoutNavbarProps) {
    const intl = useIntl();
    const router = useRouter();
    const { pathname, query } = router;
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
      (window as any).zE?.(function () {
        zE("webWidget", "setLocale", query.locale);
        zE.activate({ hideOnClose: true });
      });
    }

    const isMobile = useBreakpointValue({ base: true, sm: false });
    return (
      <Flex
        alignItems="stretch"
        as="nav"
        backgroundColor="white"
        flexDirection={{ base: "row", sm: "column" }}
        paddingX={{ base: 2, sm: 0 }}
        paddingY={{ base: 0, sm: 4 }}
        width={{ base: "auto", sm: 24 }}
        height={{ base: 16, sm: "auto" }}
        {...props}
      >
        <Center display={{ base: "none", sm: "flex" }} marginBottom={6} marginTop={2}>
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
        </Center>
        <Flex justifyContent="center" alignItems="center">
          <IconButtonWithTooltip
            id="create-petition"
            colorScheme="purple"
            icon={<AddIcon />}
            size="lg"
            isRound
            onClick={() => router.push(`/${router.query.locale}/app/petitions/new`)}
            label={intl.formatMessage({
              id: "new-petition.title",
              defaultMessage: "New petition",
            })}
            placement={isMobile ? "top" : "right"}
          />
        </Flex>
        <Flex
          as={List}
          alignSelf="stretch"
          flexDirection={{ base: "row", sm: "column" }}
          flex={{ base: 1, sm: "none" }}
          justifyContent="center"
          marginX={{ base: 2, sm: 0 }}
          marginY={{ base: 0, sm: 2 }}
        >
          {items.map(({ section, href, isActive, isAvailable, icon, text }) => (
            <ListItem key={section} id={`pw-section-${section}`}>
              <AppLayoutNavbarLink
                href={href}
                isAvailable={isAvailable}
                isActive={isActive}
                icon={icon}
              >
                {text}
              </AppLayoutNavbarLink>
            </ListItem>
          ))}
        </Flex>
        <Spacer display={{ base: "none", sm: "block" }} />
        <Stack spacing={4} alignItems="center">
          <Stack spacing={2} alignItems="center" display={{ base: "none", sm: "flex" }}>
            <NotificationsButton />
            <IconButtonWithTooltip
              label={intl.formatMessage({
                id: "navbar.help-center",
                defaultMessage: "Help center",
              })}
              placement="right"
              size="md"
              variant={"ghost"}
              backgroundColor="white"
              isRound
              onClick={handleHelpCenterClick}
              icon={<HelpOutlineIcon fontSize="22px" />}
            />
          </Stack>
          <UserMenu
            placement={isMobile ? "top-end" : "right-end"}
            user={user}
            onLocaleChange={handleLocaleChange}
          />
        </Stack>
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
