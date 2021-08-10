import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "@parallel/chakra/theme";
import { I18nProps, I18nProvider } from "@parallel/components/common/I18nProvider";
import "@parallel/styles/global.css";
import { AppProps } from "next/app";
import { createElement } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { init as initSentry } from "../utils/sentry";

type MyAppProps = AppProps & I18nProps;

initSentry();

// eslint-disable-next-line @typescript-eslint/naming-convention
function MyApp({ Component, pageProps, router, ...props }: MyAppProps) {
  return (
    <>
      {[
        [I18nProvider, props],
        [ChakraProvider, { theme, resetCSS: true, portalZIndex: 40 }],
        [DndProvider, { backend: HTML5Backend }],
      ].reduceRight(
        (acc, [provider, props]) => createElement(provider as any, props as any, acc),
        <Component {...pageProps} />
      )}
    </>
  );
}

export default MyApp;
