import {
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Portal,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { Link } from "@parallel/components/common/Link";
import { Hubspot } from "@parallel/components/scripts/Hubspot";
import { Segment } from "@parallel/components/scripts/Segment";
import { string, useQueryState, useQueryStateSlice } from "@parallel/utils/queryState";
import { useRehydrated } from "@parallel/utils/useRehydrated";
import { useUserPreference } from "@parallel/utils/useUserPreference";
import { ValueProps } from "@parallel/utils/ValueProps";
import { serialize as serializeCookie } from "cookie";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { omit } from "remeda";
import { PublicContainer } from "./PublicContainer";

type CookieType = "FUNCTIONAL" | "ANALYTICS" | "ADVERTISING";
type CookiePreferences = Record<CookieType, boolean> & {
  updatedAt: string;
};

const COOKIE_CATEGORIES: Record<CookieType, string[]> = {
  FUNCTIONAL: [
    "CRM",
    "Customer Success",
    "Deep Linking",
    "Helpdesk",
    "Livechat",
    "Performance Monitoring",
    "Personalization",
    "SMS & Push Notifications",
    "Security & Fraud",
  ],
  ANALYTICS: [
    "A/B Testing",
    "Analytics",
    "Attribution",
    "Email",
    "Enrichment",
    "Heatmaps & Recordings",
    "Raw Data",
    "Realtime Dashboards",
    "Referrals",
    "Surveys",
    "Video",
  ],
  ADVERTISING: ["Advertising", "Tag Managers"],
};

const ACCEPT_ALL: Record<CookieType, boolean> = {
  FUNCTIONAL: true,
  ANALYTICS: true,
  ADVERTISING: true,
};

const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

export function ThirdParty() {
  const intl = useIntl();
  const [cookiePreferences, setCookiePreferences] = useUserPreference<CookiePreferences | null>(
    "cookie-preferences",
    null
  );
  const showCookieBanner =
    cookiePreferences === null ||
    new Date().valueOf() - new Date(cookiePreferences.updatedAt).valueOf() > ONE_YEAR;

  const [tempCookiePreferences, setTempCookiePreferences] = useState(
    cookiePreferences ? omit(cookiePreferences, ["updatedAt"]) : { ...ACCEPT_ALL }
  );

  const rehydrated = useRehydrated();

  const [showCookiePreferences, setShowCookiePreferences] = useQueryStateSlice(
    ...useQueryState({ cookies: string() }),
    "cookies"
  );

  const types: Record<CookieType, { name: string; description: string }> = useMemo(
    () => ({
      FUNCTIONAL: {
        name: intl.formatMessage({
          id: "component.third-party.functional-title",
          defaultMessage: "Necessary",
        }),
        description: intl.formatMessage({
          id: "component.third-party.functional-description",
          defaultMessage:
            "Necessary cookies help make a website usable by enabling basic functions like page navigation and access to secure areas of the website. The website cannot function properly without these cookies.",
        }),
      },
      ANALYTICS: {
        name: intl.formatMessage({
          id: "component.third-party.analytics-title",
          defaultMessage: "Statistics",
        }),
        description: intl.formatMessage({
          id: "component.third-party.analytics-description",
          defaultMessage:
            "Statistic cookies help website owners to understand how visitors interact with websites by collecting and reporting information anonymously.",
        }),
      },
      ADVERTISING: {
        name: intl.formatMessage({
          id: "component.third-party.advertising-title",
          defaultMessage: "Marketing",
        }),
        description: intl.formatMessage({
          id: "component.third-party.advertising-description",
          defaultMessage:
            "Marketing cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user and thereby more valuable for publishers and third party advertisers.",
        }),
      },
    }),
    [intl.locale]
  );

  async function enableThirdParty(cookiePreferences: Record<CookieType, boolean> | null) {
    if (!cookiePreferences || !window.analytics || (window.analytics as any).initialized) {
      return;
    }
    try {
      const res = await fetch(
        `https://cdn.segment.com/v1/projects/${process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY}/integrations`
      );
      const destinations: { creationName: string; category: string }[] = await res.json();
      let anythingEnabled = false;
      const integrations: any = { All: false, "Segment.io": true };
      for (const destination of destinations) {
        for (const type of ["FUNCTIONAL", "ANALYTICS", "ADVERTISING"] as CookieType[]) {
          if (COOKIE_CATEGORIES[type].includes(destination.category) && cookiePreferences[type]) {
            integrations[destination.creationName] = true;
            anythingEnabled = true;
            break;
          }
        }
      }
      if (anythingEnabled) {
        window.analytics?.load(process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY, { integrations });
      }
    } catch {}

    // if no analytics or advertising place the do not track hubspot cookie
    if (!cookiePreferences?.ANALYTICS || !cookiePreferences.ADVERTISING) {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      document.cookie = serializeCookie("__hs_do_not_track", "yes", {
        expires,
        sameSite: "lax",
        path: "/",
      });
    } else {
      document.cookie = serializeCookie("__hs_do_not_track", "", { expires: new Date() });
    }
  }

  useEffect(() => {
    enableThirdParty(cookiePreferences).then();
  }, []);

  function handleSavePreferences() {
    setCookiePreferences({
      ...tempCookiePreferences,
      updatedAt: new Date().toISOString(),
    });
    setShowCookiePreferences(null);
    if (cookiePreferences === null) {
      enableThirdParty(tempCookiePreferences).then();
    } else {
      // reload to make sure new preferences are applied
      setTimeout(() => document.location.reload());
    }
  }

  function handleAcceptAllCookies() {
    setCookiePreferences({
      ...ACCEPT_ALL,
      updatedAt: new Date().toISOString(),
    });
    enableThirdParty(ACCEPT_ALL).then();
  }

  return (
    <>
      {process.env.NODE_ENV === "production" ? (
        <>
          <Segment />
          {rehydrated ? (
            <>
              {/* Load only after giving consent */}
              {cookiePreferences?.FUNCTIONAL ? <Hubspot /> : null}
            </>
          ) : null}
        </>
      ) : null}
      <Portal>
        <Modal
          size="xl"
          isOpen={showCookiePreferences !== null}
          onClose={() => setShowCookiePreferences(null)}
        >
          <ModalOverlay>
            <ModalContent>
              <ModalCloseButton
                aria-label={intl.formatMessage({
                  id: "generic.close",
                  defaultMessage: "Close",
                })}
              />
              <ModalHeader>
                <Heading as="h1" size="lg">
                  <FormattedMessage
                    id="component.third-party.preferences-header"
                    defaultMessage="Parallel cookie preferences"
                  />
                </Heading>
              </ModalHeader>
              <ModalBody>
                <Stack spacing={4}>
                  <Text>
                    <FormattedMessage
                      id="component.third-party.preferences-description"
                      defaultMessage="We use data collected by cookies and JavaScript libraries to improve your browsing experience, analyze site traffic, deliver personalized advertisements, and increase the overall performance of our site."
                    />
                  </Text>
                  {Object.entries(types).map(([type, props]) => (
                    <CookieTypeConsent
                      key={type}
                      isReadOnly={type === "FUNCTIONAL"}
                      value={tempCookiePreferences[type as CookieType]}
                      onChange={(value) =>
                        setTempCookiePreferences((x) => ({ ...x, [type]: value }))
                      }
                      {...props}
                    />
                  ))}
                </Stack>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="purple" onClick={handleSavePreferences}>
                  <FormattedMessage
                    id="component.third-party.preferences-save"
                    defaultMessage="Save preferences"
                  />
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        </Modal>
      </Portal>
      {rehydrated && showCookieBanner ? (
        <PublicContainer
          wrapper={{
            position: "fixed",
            width: "100%",
            bottom: 0,
            backgroundColor: "purple.500",
            color: "white",
            zIndex: 10,
          }}
          as={Stack}
          spacing={4}
          direction={{ base: "column", md: "row" }}
          alignItems="center"
          paddingY={8}
        >
          <Stack flex="1" spacing={1}>
            <Text>
              <FormattedMessage
                id="component.third-party.banner-text"
                defaultMessage="We use cookies and other similar technologies to help us improve your experience and personalize the content and advertising."
              />
            </Text>
            <Text>
              <Link
                href="/legal/cookies"
                {...{
                  color: "white",
                  textDecoration: "underline",
                  _hover: { color: "white" },
                  _active: { color: "white" },
                }}
              >
                <FormattedMessage
                  id="component.third-party.banner-read-more"
                  defaultMessage="Read more about our cookie policy"
                />
              </Link>
            </Text>
          </Stack>
          <Button
            borderColor="white"
            borderWidth="2px"
            variant="outline"
            backgroundColor="transparent"
            color="white"
            _hover={{
              backgroundColor: "purple.600",
              color: "white",
            }}
            onClick={() => {
              setShowCookiePreferences("1");
            }}
          >
            <FormattedMessage
              id="component.third-party.manage-button"
              defaultMessage="Manage cookies"
            />
          </Button>
          <Button
            id="cookie-content-accept"
            borderColor="white"
            borderWidth="2px"
            variant="outline"
            backgroundColor="white"
            color="purple.600"
            _hover={{
              color: "purple.700",
            }}
            rightIcon={<CheckIcon />}
            onClick={handleAcceptAllCookies}
          >
            <FormattedMessage
              id="component.third-party.accept-button"
              defaultMessage="Accept cookies"
            />
          </Button>
        </PublicContainer>
      ) : null}
    </>
  );
}

function CookieTypeConsent({
  name,
  description,
  value,
  onChange,
  isReadOnly,
}: ValueProps<boolean, false> & { name: ReactNode; description: ReactNode; isReadOnly: boolean }) {
  return (
    <Stack spacing={1}>
      <Flex alignItems="center">
        <Heading as="h2" size="md" flex="1">
          {name}
        </Heading>
        <Switch
          isDisabled={isReadOnly}
          isChecked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
      </Flex>
      <Text>{description}</Text>
    </Stack>
  );
}
