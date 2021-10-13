import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "@parallel/chakra/theme";
import { I18nProps, I18nProvider } from "@parallel/components/common/I18nProvider";
import { init as initSentry } from "@parallel/utils/sentry";
import { AppProps } from "next/app";
import Router from "next/router";
import { useEffect } from "react";
type MyAppProps = AppProps & I18nProps;

initSentry();

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

  return (
    <I18nProvider {...props}>
      <ChakraProvider theme={theme} resetCSS portalZIndex={40}>
        <Component {...pageProps} />
      </ChakraProvider>
    </I18nProvider>
  );
}

export default MyApp;
