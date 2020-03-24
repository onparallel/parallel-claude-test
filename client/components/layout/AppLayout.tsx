import { Flex, useColorMode } from "@chakra-ui/core";
import { AppLayoutNavbar_UserFragment } from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { ReactNode } from "react";
import { AppLayoutNavbar } from "./AppLayoutNavbar";
import { useCreatePetition } from "@parallel/utils/useCreatePetition";
import { useRouter } from "next/router";

export interface AppLayoutProps {
  onCreate?: () => void;
  user: AppLayoutNavbar_UserFragment;
  children: ReactNode;
}

export function AppLayout({ user, onCreate, children }: AppLayoutProps) {
  const router = useRouter();
  const createPetition = useCreatePetition();
  async function defaultOnCreate() {
    try {
      const id = await createPetition();
      router.push(
        `/[locale]/app/petitions/[petitionId]/compose`,
        `/${router.query.locale}/app/petitions/${id}/compose`
      );
    } catch {}
  }
  return (
    <Flex alignItems="stretch" minHeight="100vh">
      <AppLayoutNavbar
        user={user}
        zIndex={2}
        onCreate={onCreate ?? defaultOnCreate}
      />
      <Flex
        as="main"
        flex="1"
        flexDirection="column"
        maxHeight="100vh"
        backgroundColor="gray.50"
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
  `,
};
