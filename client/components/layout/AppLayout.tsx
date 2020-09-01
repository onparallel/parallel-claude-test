import { gql } from "@apollo/client";
import { BoxProps, Flex } from "@chakra-ui/core";
import {
  AppLayout_UserFragment,
  OnboardingKey,
  OnboardingStatus,
  useAppLayout_updateOnboardingStatusMutation,
} from "@parallel/graphql/__types";
import Head from "next/head";
import { useCallback, useContext } from "react";
import {
  OnboardingTour,
  OnboardingTourContext,
} from "../common/OnboardingTour";
import { AppLayoutNavbar } from "./AppLayoutNavbar";

export type AppLayoutProps = BoxProps & {
  title: string;
  user: AppLayout_UserFragment;
};

export function AppLayout({ title, user, children, ...props }: AppLayoutProps) {
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
  return (
    <>
      <Head>
        <title>{title} | Parallel</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      <Flex
        alignItems="stretch"
        overflow="hidden"
        height="100vh"
        sx={{
          "@supports (-webkit-touch-callout: none)": {
            height: "-webkit-fill-available",
          },
        }}
      >
        <AppLayoutNavbar
          user={user}
          onOnboardingClick={handleOnboardingClick}
          zIndex="2"
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
