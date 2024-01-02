import { ChakraProvider } from "@chakra-ui/react";
import { Fonts } from "@parallel/chakra/fonts";
import { theme } from "@parallel/chakra/theme";
import { I18nProps, I18nProvider } from "@parallel/components/common/I18nProvider";
import { LiquidProvider } from "@parallel/utils/liquid/LiquidContext";
import { AppProps } from "next/app";
import Router from "next/router";
import { useEffect, useRef } from "react";

interface MyAppProps extends AppProps, I18nProps {}

// eslint-disable-next-line @typescript-eslint/naming-convention
function MyApp({ Component, pageProps, router, ...props }: MyAppProps) {
  useEffect(() => {
    const handleRouteChange = () => {
      window.analytics?.page({
        pathname: Router.pathname,
        params: Router.query,
      });
    };
    handleRouteChange();
    Router.events.on("routeChangeComplete", handleRouteChange);
    return () => Router.events.off("routeChangeComplete", handleRouteChange);
  }, []);

  useEffect(() => {
    (window as any).__REHYDRATED__ = true;
    window.dispatchEvent(new CustomEvent("NEXTJS_REHYDRATION_COMPLETE"));
  }, []);

  const toastPortalRef = useRef<HTMLDivElement>(null);

  return (
    <LiquidProvider>
      <I18nProvider {...props}>
        <ChakraProvider
          theme={theme}
          resetCSS
          portalZIndex={40}
          cssVarsRoot="body"
          toastOptions={{
            portalProps: {
              containerRef: toastPortalRef,
            },
          }}
        >
          <Fonts />
          <Component {...pageProps} />
          <div ref={toastPortalRef} />
        </ChakraProvider>
      </I18nProvider>
    </LiquidProvider>
  );
}

export default MyApp;
