import { gql } from "@apollo/client";
import {
  AlertDescription,
  AlertIcon,
  Button,
  Center,
  Circle,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { AppLayout_QueryFragment } from "@parallel/graphql/__types";
import { useCheckForNewVersion } from "@parallel/utils/useCheckForNewVersion";
import { useRehydrated } from "@parallel/utils/useRehydrated";
import * as Sentry from "@sentry/node";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import userflow from "userflow.js";
import { CloseableAlert } from "../common/CloseableAlert";
import { NotificationsDrawer } from "../notifications/NotificationsDrawer";
import { Canny } from "../scripts/Canny";
import { Segment } from "../scripts/Segment";
import { AppLayoutNavbar } from "./AppLayoutNavbar";

export interface AppLayoutProps extends AppLayout_QueryFragment {
  title: string;
}

export const AppLayout = Object.assign(
  chakraForwardRef<"div", AppLayoutProps>(function AppLayout(
    { title, me, realMe, children, ...props },
    ref
  ) {
    const rehydrated = useRehydrated();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const hasNewVersion = useCheckForNewVersion();

    const timeoutRef = useRef<number>();
    // Show spinner if a page takes more than 1s to load
    useEffect(() => {
      router.events.on("routeChangeStart", handleRouteChangeStart);
      router.events.on("routeChangeError", handleRouteChangeFinish);
      router.events.on("routeChangeComplete", handleRouteChangeFinish);
      return () => {
        window.clearTimeout(timeoutRef.current);
        router.events.off("routeChangeStart", handleRouteChangeStart);
        router.events.off("routeChangeError", handleRouteChangeFinish);
        router.events.off("routeChangeComplete", handleRouteChangeFinish);
      };
      function handleRouteChangeStart() {
        if (!isDefined(timeoutRef.current)) {
          timeoutRef.current = window.setTimeout(() => {
            timeoutRef.current = undefined;
            setIsLoading(true);
          }, 1000);
        }
      }
      function handleRouteChangeFinish() {
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        } else {
          setIsLoading(false);
        }
      }
    }, []);

    useEffect(() => {
      window.Canny?.("initChangelog", {
        appID: process.env.NEXT_PUBLIC_CANNY_APPID,
        position: "right",
        align: "bottom",
      });
    }, []);

    // Load Segment analytics and identify user
    useEffect(() => {
      if (window.analytics && !(window.analytics as any).initialized) {
        window.analytics?.load(process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY);
      }
      window.analytics?.identify(me.id, {
        email: me.email,
        locale: router.locale,
        firstName: me.firstName,
        lastName: me.lastName,
        createdAt: me.createdAt,
        orgRole: me.role,
        name: me.fullName!,
      });
    }, [me.id]);

    // Initialize userflow
    useEffect(() => {
      if (!userflow.isIdentified()) {
        userflow.init(process.env.NEXT_PUBLIC_USERFLOW_TOKEN);
        userflow.identify(me.id, {
          name: me.fullName,
          email: me.email,
          signed_up_at: me.createdAt,
          device_type: window.innerWidth < 480 ? "mobile" : "desktop",
        });
      }
    }, [me.id]);

    // Identify user in Sentry
    useEffect(() => {
      Sentry.setUser({ id: me.id, email: me.email });
      return () => {
        Sentry.setUser(null);
      };
    }, [me.id]);

    function handleHelpCenterClick() {
      window.analytics?.track("Help Center Clicked", {
        userId: me.id,
        from: window.innerWidth < 480 ? "mobile" : "desktop",
      });
    }

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
            <Segment />
            <Canny />
          </>
        ) : null}
        <DndProvider backend={HTML5Backend}>
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
                me={me}
                realMe={realMe}
                onHelpCenterClick={handleHelpCenterClick}
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
                ref={ref}
                flex="1"
                as="main"
                direction="column"
                minHeight={0}
                overflow="auto"
                {...props}
              >
                {hasNewVersion ? (
                  <CloseableAlert status="info" flexShrink={0}>
                    <AlertIcon />
                    <AlertDescription display="block" flex="1">
                      <FormattedMessage
                        id="component.app-layout.new-version-available"
                        defaultMessage="There's a new release of Parallel available. Please refresh your browser for it to take effect."
                      />
                    </AlertDescription>
                    <Button
                      variant="outline"
                      colorScheme="blue"
                      backgroundColor="white"
                      size="sm"
                      marginX={2}
                      onClick={() => window.location.reload()}
                    >
                      <FormattedMessage
                        id="component.app-layout.refresh-button"
                        defaultMessage="Refresh"
                      />
                    </Button>
                  </CloseableAlert>
                ) : null}
                {rehydrated && !isLoading ? (
                  children
                ) : (
                  <Center flex="1">
                    <Spinner
                      thickness="4px"
                      speed="0.65s"
                      emptyColor="gray.200"
                      color="primary.500"
                      size="xl"
                    />
                  </Center>
                )}
              </Flex>
            </Flex>
          </Flex>
          {/* Intercom placeholder */}
          {process.env.NODE_ENV === "development" ? (
            <Circle
              backgroundColor="black"
              opacity={0.5}
              position="fixed"
              size="60px"
              bottom="20px"
              right="20px"
            />
          ) : null}
          <NotificationsDrawer />
        </DndProvider>
      </>
    );
  }),
  {
    fragments: {
      Query: gql`
        fragment AppLayout_Query on Query {
          me {
            id
            fullName
            firstName
            lastName
            email
            createdAt
            role
          }
          ...AppLayoutNavbar_Query
        }
        ${AppLayoutNavbar.fragments.Query}
      `,
    },
  }
);
