import { gql } from "@apollo/client";
import { Center, Flex, Spinner } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { AppLayout_UserFragment } from "@parallel/graphql/__types";
import { useRehydrated } from "@parallel/utils/useRehydrated";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import userflow from "userflow.js";
import { NotificationsDrawer } from "../notifications/NotificationsDrawer";
import { Segment } from "../scripts/Segment";
import { Zendesk } from "../scripts/Zendesk";
import { AppLayoutNavbar } from "./AppLayoutNavbar";

export interface AppLayoutProps {
  title: string;
  user: AppLayout_UserFragment;
}

export const AppLayout = Object.assign(
  chakraForwardRef<"div", AppLayoutProps>(function AppLayout(
    { title, user, children, ...props },
    ref
  ) {
    const rehydrated = useRehydrated();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const timeoutRef = useRef<number>();
    // Show spinner if a page takes more than 1s to load
    useEffect(() => {
      router.events.on("routeChangeStart", handleRouteChangeStart);
      router.events.on("routeChangeComplete", handleRouteChangeComplete);
      return () => {
        window.clearTimeout(timeoutRef.current);
        router.events.off("routeChangeStart", handleRouteChangeStart);
        router.events.off("routeChangeComplete", handleRouteChangeComplete);
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

    // Hide zendesk launcher on route changes
    useEffect(() => {
      const hide = () => window.zE?.hide?.();
      router.events.on("routeChangeStart", hide);
      window.addEventListener("load", hide);
      return () => {
        router.events.off("routeChangeStart", hide);
        window.removeEventListener("load", hide);
      };
    }, []);

    // Load Segment analytics and identify user
    useEffect(() => {
      if (window.analytics && !(window.analytics as any).initialized) {
        window.analytics?.load(process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY);
      }
      window.analytics?.identify(user.id, {
        email: user.email,
        locale: router.locale,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }, [user.id]);

    // Initialize userflow
    useEffect(() => {
      if (!userflow.isIdentified()) {
        userflow.init(process.env.NEXT_PUBLIC_USERFLOW_TOKEN);
        userflow.identify(user.id, {
          name: user.fullName,
          email: user.email,
          signed_up_at: user.createdAt,
        });
      }
    }, [user.id]);

    function handleHelpCenterClick() {
      window.zE?.activate?.({ hideOnClose: true });
    }

    function handleZendeskLoad() {
      window.zE?.("webWidget", "hide");
      window.zE?.("webWidget", "prefill", {
        name: { value: user.fullName, readOnly: true },
        email: { value: user.email, readOnly: true },
      });
      window.zE?.("webWidget", "setLocale", router.locale);
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
            <Zendesk onLoad={handleZendeskLoad} />
            <Segment />
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
                user={user}
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
          <NotificationsDrawer />
        </DndProvider>
      </>
    );
  }),
  {
    fragments: {
      User: gql`
        fragment AppLayout_User on User {
          id
          fullName
          firstName
          lastName
          email
          createdAt
          canCreateUsers # UserSelect reads this from cache
          ...AppLayoutNavbar_User
        }
        ${AppLayoutNavbar.fragments.User}
      `,
    },
  }
);
