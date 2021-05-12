import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "@parallel/chakra/theme";
import {
  I18nProps,
  I18nProvider,
} from "@parallel/components/common/I18nProvider";
import PlausibleProvider from "next-plausible";
import { AppProps } from "next/app";
import { createElement, useEffect } from "react";
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

  return (
    <>
      {[
        [
          PlausibleProvider,
          {
            customDomain: "https://p.onparallel.com",
            domain: "onparallel.com",
            exclude: "/*/print/*, /*/app/*, /*/petition/*",
          },
        ],
        [I18nProvider, props],
        [ChakraProvider, { theme, resetCSS: true, portalZIndex: 40 }],
        [DndProvider, { backend: HTML5Backend }],
      ].reduceRight(
        (acc, [provider, props]) =>
          createElement(provider as any, props as any, acc),
        <Component {...pageProps} />
      )}
    </>
  );
}

export default MyApp;
