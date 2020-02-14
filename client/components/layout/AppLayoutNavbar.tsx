import {
  Box,
  BoxProps,
  Flex,
  IconButton,
  List,
  ListItem,
  PseudoBox,
  useColorMode
} from "@chakra-ui/core";
import { AppLayoutNavbar_UserFragment } from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import { Logo } from "../common/Logo";
import { AppLayoutNavbarLink } from "./AppLayoutNavbarLink";
import { UserMenu } from "./UserMenu";
import { NakedLink } from "../common/Link";

export type AppLayoutNavbarProps = BoxProps & {
  user: AppLayoutNavbar_UserFragment;
};

export function AppLayoutNavbar({ user, ...props }: AppLayoutNavbarProps) {
  const { colorMode } = useColorMode();
  const { pathname } = useRouter();
  const intl = useIntl();
  const items = [
    {
      section: "sendouts",
      icon: "paper-plane",
      text: intl.formatMessage({
        id: "navbar.sendouts-link",
        defaultMessage: "Sendouts"
      })
    },
    {
      section: "petitions",
      icon: "file-alt",
      text: intl.formatMessage({
        id: "navbar.petitions-link",
        defaultMessage: "Petitions"
      })
    },
    {
      section: "contacts",
      icon: "address-book",
      text: intl.formatMessage({
        id: "navbar.contacts-link",
        defaultMessage: "Contacts"
      })
    }
  ];
  return (
    <Flex
      flexDirection="column"
      as="nav"
      shadow="md"
      width={24}
      backgroundColor={{ light: "white", dark: "gray.900" }[colorMode]}
      {...props}
    >
      <Flex justifyContent="center" marginTop={6} marginBottom={6}>
        <NakedLink href="/app">
          <Box as="a" width="40px" height="40px" position="relative">
            <PseudoBox
              position="absolute"
              cursor="pointer"
              transition="transform 200ms ease"
              _hover={{
                color: {
                  light: "gray.900",
                  dark: "purple.200"
                }[colorMode],
                transform: "scale(1.1)"
              }}
            >
              <Logo width={40} hideText={true}></Logo>
            </PseudoBox>
          </Box>
        </NakedLink>
      </Flex>
      <Flex justifyContent="center" marginBottom={4}>
        <IconButton
          variantColor="purple"
          icon="add"
          size="lg"
          isRound
          aria-label={intl.formatMessage({
            id: "navbar.new-button",
            defaultMessage: "Create a new petition"
          })}
        ></IconButton>
      </Flex>
      <List>
        {items.map(({ section, icon, text }) => (
          <ListItem key={section}>
            <AppLayoutNavbarLink
              href={`/app/${section}`}
              active={pathname === `/[locale]/app/${section}`}
              icon={icon}
            >
              {text}
            </AppLayoutNavbarLink>
          </ListItem>
        ))}
      </List>
      <Box flex="1"></Box>
      <Flex justifyContent="center" marginY={4}>
        <UserMenu user={user}></UserMenu>
      </Flex>
    </Flex>
  );
}

AppLayoutNavbar.fragments = {
  user: gql`
    fragment AppLayoutNavbar_User on User {
      ...UserMenu_User
    }
    ${UserMenu.fragments.user}
  `
};
