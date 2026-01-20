import { gql } from "@apollo/client";
import {
  AlertDescription,
  AlertIcon,
  Button,
  Center,
  Circle,
  Flex,
  PortalManager,
  Spinner,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { AppLayout_QueryFragment } from "@parallel/graphql/__types";
import { useCheckForNewVersion } from "@parallel/utils/useCheckForNewVersion";
import { useCookie } from "@parallel/utils/useCookie";
import { useOnMediaQueryChange } from "@parallel/utils/useOnMediaQueryChange";
import { useRehydrated } from "@parallel/utils/useRehydrated";
import * as Sentry from "@sentry/nextjs";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { FormattedMessage } from "react-intl";
import { isNullish } from "remeda";
import { noop } from "ts-essentials";
import userflow from "userflow.js";
import { CloseableAlert } from "../common/CloseableAlert";
import { NotificationsDrawer } from "../notifications/NotificationsDrawer";
import { AppLayoutNavBar } from "./AppLayoutNavBar";

const HIDE_INTERCOM_PATHS = ["/app/petitions/[petitionId]/preview"];

export interface AppLayoutProps {
  queryObject: AppLayout_QueryFragment;
  title: string;
}

export const AppLayout = chakraForwardRef<"div", AppLayoutProps>(function AppLayout(
  { title, queryObject, children, ...props },
  ref,
) {
  const { me, realMe } = queryObject;
  const rehydrated = useRehydrated();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const hasNewVersion = useCheckForNewVersion();
  const [hasNavBarExpanded] = useCookie(`navbar-expanded-${realMe.id}`, false);

  const timeoutRef = useRef<number>();

  useOnMediaQueryChange(
    "sm",
    useCallback((matches) => {
      if (!matches || HIDE_INTERCOM_PATHS.includes(router.pathname)) {
        window.intercomSettings = { hide_default_launcher: true };
      }
      window.Intercom?.("update");
    }, []),
  );

  // Show spinner if a page takes more than 1s to load
  useEffect(() => {
    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeError", handleRouteChangeComplete);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    return () => {
      window.clearTimeout(timeoutRef.current);
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeError", handleRouteChangeComplete);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
    function handleRouteChangeStart(_: any, options: { shallow: boolean }) {
      if (options.shallow) {
        return;
      }
      if (isNullish(timeoutRef.current)) {
        timeoutRef.current = window.setTimeout(() => {
          timeoutRef.current = undefined;
          setIsLoading(true);
        }, 1000);
      }
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
    window.Canny?.("initChangelog", {
      appID: process.env.NEXT_PUBLIC_CANNY_APPID,
      position: "right",
      align: "bottom",
    });
  }, []);

  //Identify user in canny to autologin
  useEffect(() => {
    window.Canny?.("identify", {
      appID: process.env.NEXT_PUBLIC_CANNY_APPID,
      user: {
        email: me.email,
        name: me.fullName,
        id: me.id,
        created: new Date(me.createdAt).toISOString(),
      },
    });
  }, [me.id]);

  // Load Segment analytics and identify user
  useEffect(() => {
    if (me.id === realMe.id) {
      if (window.analytics && !(window.analytics as any).initialized) {
        window.analytics?.load(process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY);
      }
      window.analytics?.identify(me.id, {
        email: me.email,
        locale: router.locale,
        firstName: me.firstName,
        lastName: me.lastName,
        createdAt: me.createdAt,
        isOrgOwner: me.isOrgOwner,
        name: me.fullName!,
        lastActiveAt: me.lastActiveAt,
        company: {
          id: me.organization.id,
          name: me.organization.name,
          petitionsSubscriptionEndDate: me.organization.petitionsSubscriptionEndDate,
        },
        hasNavBarExpanded,
      });
    }
  }, [me.id, realMe.id]);

  // Initialize userflow
  useEffect(() => {
    if (!userflow.isIdentified() && process.env.NODE_ENV === "production" && me.id === realMe.id) {
      // don't show userflow to certain users for better e2e testing purposes
      const userflowOmitEmails = (process.env.NEXT_PUBLIC_USERFLOW_OMIT ?? "").split(",");
      if (
        userflowOmitEmails.some((e) => {
          const [l, d] = e.split("@");
          const [local, domain] = me.email.split("@");
          return d === domain && (l === local || local.startsWith(l + "+"));
        })
      ) {
        return;
      }
      userflow.load().catch(noop);
      userflow.init(process.env.NEXT_PUBLIC_USERFLOW_TOKEN);
      userflow.identify(me.id, {
        name: me.fullName,
        email: me.email,
        signed_up_at: me.createdAt,
        device_type: window.innerWidth < 480 ? "mobile" : "desktop",
      });
    }
  }, [me.id, realMe.id]);

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

  useEffect(() => {
    if (process.env.ENV === "staging") {
      /* eslint-disable no-console */
      console.log("Permissions: ", me.permissions);
      /* eslint-enable no-console */
    }
  }, []);

  return (
    <>
      <Head>
        <title>{
          // eslint-disable-next-line formatjs/no-literal-string-in-jsx
          `${title} | Parallel`
        }</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      <DndProvider
        backend={HTML5Backend}
        context={typeof window !== "undefined" ? window : undefined}
      >
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
          flexDirection={{ base: "column", sm: "row" }}
        >
          <PortalManager zIndex={50}>
            <AppLayoutNavBar queryObject={queryObject} onHelpCenterClick={handleHelpCenterClick} />
          </PortalManager>

          <Flex
            flex="1"
            flexDirection="column"
            minHeight="0"
            minWidth="0"
            backgroundColor="gray.50"
            zIndex={1}
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
                <CloseableAlert status="info">
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
            display={{ base: "none", sm: "block" }}
            backgroundColor="black"
            opacity={0.5}
            position="fixed"
            size="48px"
            bottom="20px"
            insetEnd="20px"
            zIndex={2147483001}
          />
        ) : null}
        <NotificationsDrawer />
      </DndProvider>
    </>
  );
});

const _fragments = {
  Query: gql`
    fragment AppLayout_Query on Query {
      me {
        id
        fullName
        firstName
        lastName
        email
        createdAt
        permissions
        isOrgOwner
        lastActiveAt
        organization {
          id
          name
          petitionsSubscriptionEndDate: subscriptionEndDate(limitName: PETITION_SEND)
          hasIdVerification: hasIntegration(integration: ID_VERIFICATION)
        }
        hasBackgroundCheck: hasFeatureFlag(featureFlag: BACKGROUND_CHECK)
        hasAdverseMediaSearch: hasFeatureFlag(featureFlag: ADVERSE_MEDIA_SEARCH)
        hasRemovePreviewFiles: hasFeatureFlag(featureFlag: REMOVE_PREVIEW_FILES)
      }
      realMe {
        id
      }
      ...useBrowserMetadata_Query
      ...AppLayoutNavBar_Query
    }
  `,
};
