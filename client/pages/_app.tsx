import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "@parallel/chakra/theme";
import {
  I18nProps,
  I18nProvider,
} from "@parallel/components/common/I18nProvider";
import { GoogleAnalytics } from "@parallel/components/scripts/GoogleAnalytics";
import { Hotjar } from "@parallel/components/scripts/Hotjar";
import { Hubspot } from "@parallel/components/scripts/Hubspot";
import { AppProps } from "next/app";
import { useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { init as initSentry } from "../utils/sentry";

type MyAppProps = AppProps & I18nProps;

initSentry();

// eslint-disable-next-line @typescript-eslint/naming-convention
function MyApp({ Component, pageProps, router, ...props }: MyAppProps) {
  useEffect(() => {
    // some 3rd party is adding this which makes some stuff look bad on development
    const element = document.querySelector('style[data-merge-styles="true"]');
    if (element) {
      element.parentElement?.removeChild(element);
    }
  }, []);

  const loadTrackingScripts =
    process.env.NODE_ENV === "production" &&
    !router.pathname.startsWith("/[locale]/print");
  return (
    <>
      {loadTrackingScripts ? (
        <>
          <GoogleAnalytics />
          <Hubspot />
          <Hotjar />
        </>
      ) : null}
      <I18nProvider {...props}>
        <ChakraProvider theme={theme} resetCSS portalZIndex={40}>
          <DndProvider backend={HTML5Backend}>
            <Component {...pageProps} />
          </DndProvider>
        </ChakraProvider>
      </I18nProvider>
    </>
  );
}

export default MyApp;
