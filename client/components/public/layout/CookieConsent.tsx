import { Button, Text } from "@chakra-ui/core";
import { Link } from "@parallel/components/common/Link";
import Cookie from "js-cookie";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "./PublicContainer";

const COOKIE_NAME = "cookie-consent";

export type CookieConsentProps = {};

export function CookieConsent({}: CookieConsentProps) {
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  useEffect(() => {
    const hasConsent = Cookie.getJSON(COOKIE_NAME);
    setShowConsentBanner(!hasConsent);
  }, []);

  function handleConsentClick() {
    Cookie.set(COOKIE_NAME, "true", { sameSite: "strict" });
    setShowConsentBanner(false);
  }

  return showConsentBanner ? (
    <PublicContainer
      wrapper={{
        position: "fixed",
        width: "100%",
        bottom: 0,
        backgroundColor: "purple.500",
        zIndex: 10,
      }}
      paddingY={4}
      color="white"
      display="flex"
      flexWrap="wrap"
      justifyContent="center"
      alignItems="center"
    >
      <Text fontSize="md">
        <FormattedMessage
          id="component.cookie-consent.text"
          defaultMessage="Cookies help us improve your experience and personalize the content and advertising. By using our website, you agree to our <a>use of cookies</a>."
          values={{
            a: (...chunks: any[]) => (
              <Link
                href="/legal/[doc]"
                as="/legal/cookies"
                {...{
                  color: "white",
                  textDecoration: "underline",
                  _hover: { color: "white" },
                  _active: { color: "white" },
                }}
              >
                {chunks}
              </Link>
            ),
          }}
        ></FormattedMessage>
      </Text>
      <Button
        marginX={4}
        marginY={2}
        borderColor="white"
        borderWidth="2px"
        variant="outline"
        backgroundColor="transparent"
        color="white"
        _hover={{
          backgroundColor: "purple.600",
          color: "white",
        }}
        rightIcon="check"
        onClick={handleConsentClick}
      >
        <FormattedMessage
          id="component.cookie-consent.accept-button"
          defaultMessage="Accept"
        ></FormattedMessage>
      </Button>
    </PublicContainer>
  ) : null;
}
