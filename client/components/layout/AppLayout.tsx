/** @jsx jsx */
import { gql } from "@apollo/client";
import { BoxProps, Flex } from "@chakra-ui/core";
import { css, jsx } from "@emotion/core";
import {
  AppLayout_UserFragment,
  OnboardingKey,
  OnboardingStatus,
  useAppLayout_updateOnboardingStatusMutation,
} from "@parallel/graphql/__types";
import { useCreatePetition } from "@parallel/utils/useCreatePetition";
import { useRouter } from "next/router";
import { useCallback, useContext } from "react";
import {
  OnboardingTour,
  OnboardingTourContext,
} from "../common/OnboardingTour";
import { AppLayoutNavbar } from "./AppLayoutNavbar";
import Head from "next/head";

export type AppLayoutProps = BoxProps & {
  title: string;
  user: AppLayout_UserFragment;
};

export function AppLayout({ title, user, children, ...props }: AppLayoutProps) {
  const router = useRouter();
  const createPetition = useCreatePetition();
  const handleOnCreate = useCallback(async function () {
    try {
      const id = await createPetition();
      router.push(
        `/[locale]/app/petitions/[petitionId]/compose`,
        `/${router.query.locale}/app/petitions/${id}/compose`
      );
    } catch {}
  }, []);

  /* Onboarding tour callbacks */
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
  const handleOnboardingClick = useCallback(
    function () {
      if (isRunning) {
        document.querySelector<HTMLElement>(".react-joyride__beacon")?.click();
      } else {
        toggle(true);
      }
    },
    [isRunning, toggle]
  );
  const breakpoint = "sm";
  return (
    <>
      <Head>
        <title>{title} | Parallel</title>
      </Head>
      <Flex
        alignItems="stretch"
        overflow="hidden"
        css={css`
          height: 100vh;
          height: -webkit-fill-available;
        `}
      >
        <AppLayoutNavbar
          user={user}
          onCreate={handleOnCreate}
          onOnboardingClick={handleOnboardingClick}
          display={{ base: "none", [breakpoint]: "flex" }}
          zIndex="1"
        />
        <Flex
          flex="1"
          flexDirection="column"
          maxHeight="100vh"
          minWidth="0"
          backgroundColor="gray.50"
        >
          <Flex
            flex="1"
            as="main"
            direction="column"
            minHeight={0}
            overflow="auto"
            {...props}
          >
            {children}
          </Flex>
          <AppLayoutNavbar
            isMobile
            user={user}
            onCreate={handleOnCreate}
            display={{ base: "flex", [breakpoint]: "none" }}
            onOnboardingClick={handleOnboardingClick}
          />
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
