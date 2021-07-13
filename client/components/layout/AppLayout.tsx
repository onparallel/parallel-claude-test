import { gql } from "@apollo/client";
import { BoxProps, Center, Flex, Spinner } from "@chakra-ui/react";
import {
  AppLayout_UserFragment,
  OnboardingKey,
  OnboardingStatus,
  useAppLayout_updateOnboardingStatusMutation,
} from "@parallel/graphql/__types";
import { useRehydrated } from "@parallel/utils/useRehydrated";
import Head from "next/head";
import Router from "next/router";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  OnboardingTour,
  OnboardingTourContext,
} from "../common/OnboardingTour";
import { NotificationsDrawer } from "../notifications/NotificationsDrawer";
import { Segment } from "../scripts/Segment";
import { Zendesk } from "../scripts/Zendesk";
import { AppLayoutNavbar } from "./AppLayoutNavbar";

export interface AppLayoutProps extends BoxProps {
  title: string;
  user: AppLayout_UserFragment;
}

declare const zE: any;

export function AppLayout({ title, user, children, ...props }: AppLayoutProps) {
  /* Onboarding tour callbacks */
  const [updateOnboardingStatus] =
    useAppLayout_updateOnboardingStatusMutation();
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
      (window as any).zE?.(() => zE.hide());
    },
    [isRunning, toggle]
  );
  const rehydrated = useRehydrated();
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<number>();
  useEffect(() => {
    // show spinner if a page takes more than 1s to load
    Router.events.on("routeChangeStart", handleRouteChangeStart);
    Router.events.on("routeChangeComplete", handleRouteChangeComplete);
    return () => {
      window.clearTimeout(timeoutRef.current);
      Router.events.off("routeChangeStart", handleRouteChangeStart);
      Router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
    function handleRouteChangeStart() {
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = undefined;
        setIsLoading(true);
      }, 1000);
    }
    function handleRouteChangeComplete() {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      } else {
        setIsLoading(false);
      }
    }
  }, []);
  useEffect(() => {
    const hide = () => (window as any).zE?.(() => zE.hide());
    Router.events.on("routeChangeStart", hide);
    window.addEventListener("load", hide);
    return () => {
      Router.events.off("routeChangeStart", hide);
      window.removeEventListener("load", hide);
    };
  }, []);
  useEffect(() => {
    window.analytics?.identify(user.id);
  }, [user.id]);
  return (
    <>
      <Head>
        <title>{title} | Parallel</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      {process.env.NODE_ENV !== "development" ? (
        <>
          <Zendesk />
          <Segment />
        </>
      ) : null}
      <Flex
        alignItems="stretch"
        overflow="hidden"
        height="100vh"
        maxWidth="100vw"
        sx={{
          "@supports (-webkit-touch-callout: none)": {
            height: "-webkit-fill-available",
          },
        }}
        flexDirection={{ base: "column-reverse", sm: "row" }}
      >
        <Flex
          flexDirection={{ base: "row", sm: "column" }}
          flexShrink={0}
          borderWidth={{ base: "1px 0 0 0", sm: "0 1px 0 0" }}
          borderColor="gray.200"
          overflow={{ base: "auto hidden", sm: "hidden auto" }}
        >
          <AppLayoutNavbar
            user={user}
            onOnboardingClick={handleOnboardingClick}
            flex="1"
            zIndex="2"
          />
        </Flex>
        <Flex
          flex="1"
          flexDirection="column"
          minHeight="0"
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
            {rehydrated && !isLoading ? (
              children
            ) : (
              <Center flex="1">
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="purple.500"
                  size="xl"
                />
              </Center>
            )}
          </Flex>
        </Flex>
      </Flex>
      <OnboardingTour
        onUpdateTour={handleUpdateTour}
        status={user.onboardingStatus as any}
      />
      <NotificationsDrawer />
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
