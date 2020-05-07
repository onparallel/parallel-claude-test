import { BoxProps, Flex } from "@chakra-ui/core";
import { AppLayoutNavbar_UserFragment } from "@parallel/graphql/__types";
import { useCreatePetition } from "@parallel/utils/useCreatePetition";
import { gql } from "apollo-boost";
import { useRouter } from "next/router";
import { AppLayoutNavbar } from "./AppLayoutNavbar";

export type AppLayoutProps = BoxProps & {
  onCreate?: () => void;
  user: AppLayoutNavbar_UserFragment;
};

export function AppLayout({
  user,
  onCreate,
  children,
  ...props
}: AppLayoutProps) {
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
    <Flex alignItems="stretch" height="100vh" overflow="hidden">
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
        overflow="auto"
        {...props}
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
