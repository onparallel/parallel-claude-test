import { BoxProps, Flex } from "@chakra-ui/core";
import {
  AppLayout_UserFragment,
  OnboardingKey,
  OnboardingStatus,
  useAppLayout_updateOnboardingStatusMutation,
} from "@parallel/graphql/__types";
import { useCreatePetition } from "@parallel/utils/useCreatePetition";
import { gql } from "apollo-boost";
import { useRouter } from "next/router";
import { useContext } from "react";
import {
  OnboardingTour,
  OnboardingTourContext,
} from "../common/OnboardingTour";
import { AppLayoutNavbar } from "./AppLayoutNavbar";

export type AppLayoutProps = BoxProps & {
  onCreate?: () => void;
  user: AppLayout_UserFragment;
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

  /* Onboarding tour cllbacks */
  const [
    updateOnboardingStatus,
  ] = useAppLayout_updateOnboardingStatusMutation();
  const handleUpdateTour = async function (
    key: OnboardingKey,
    status: OnboardingStatus
  ) {
    await updateOnboardingStatus({ variables: { key, status } });
  };
  const { isRunning, toggle } = useContext(OnboardingTourContext);
  function handleOnboardingClick() {
    if (isRunning) {
      document.querySelector<HTMLElement>(".react-joyride__beacon")?.click();
    } else {
      toggle(true);
    }
  }

  return (
    <>
      <Flex alignItems="stretch" height="100vh" overflow="hidden">
        <AppLayoutNavbar
          user={user}
          zIndex={2}
          onCreate={onCreate ?? defaultOnCreate}
          onOnboardingClick={handleOnboardingClick}
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
      <OnboardingTour
        onUpdateTour={handleUpdateTour}
        status={user.onboardingStatus as any}
      />
    </>
  );
}

AppLayout.fragments = {
  User: gql`
    fragment AppLayout_User on User {
      id
      ...AppLayoutNavbar_User
      ...OnboardingTour_User
    }
    ${AppLayoutNavbar.fragments.User}
    ${OnboardingTour.fragments.User}
  `,
};

AppLayout.mutations = [
  gql`
    mutation AppLayout_updateOnboardingStatus(
      $key: OnboardingKey!
      $status: OnboardingStatus!
    ) {
      updateOnboardingStatus(key: $key, status: $status) {
        id
        onboardingStatus
      }
    }
  `,
];
