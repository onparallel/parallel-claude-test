import { Box, Flex, useColorMode } from "@chakra-ui/core";
import { ReactNode } from "react";
import { ToggleColorModeButton } from "../common/ToggleColorModeButton";
import { AppLayoutNavbar } from "./AppLayoutNavbar";
import { gql } from "apollo-boost";
import { AppLayoutNavbar_UserFragment } from "@parallel/graphql/__types";

export interface AppLayoutProps {
  user: AppLayoutNavbar_UserFragment;
  children: ReactNode;
}

export function AppLayout({ user, children }: AppLayoutProps) {
  const { colorMode } = useColorMode();
  return (
    <Flex alignItems="stretch" minHeight="100vh">
      <AppLayoutNavbar user={user} zIndex={2} />
      <Flex
        as="main"
        flex="1"
        flexDirection="column"
        backgroundColor={{ light: "gray.50", dark: "gray.600" }[colorMode]}
      >
        {children}
      </Flex>
    </Flex>
  );
}

AppLayout.fragments = {
  user: gql`
    fragment AppLayout_User on User {
      ...AppLayoutNavbar_User
    }
    ${AppLayoutNavbar.fragments.user}
  `
};
