import { ChakraProvider, CSSReset } from "@chakra-ui/core";
import { theme } from "@parallel/chakra/theme";
import { DialogOpenerProvider } from "@parallel/components/common/DialogOpenerProvider";
import {
  I18nProps,
  I18nProvider,
} from "@parallel/components/common/I18nProvider";
import { GoogleAnalytics } from "@parallel/components/scripts/GoogleAnalytics";
import { Hotjar } from "@parallel/components/scripts/Hotjar";
import { Hubspot } from "@parallel/components/scripts/Hubspot";
import { AppProps } from "next/app";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

type MyAppProps = AppProps & I18nProps;

// eslint-disable-next-line @typescript-eslint/naming-convention
function MyApp({ Component, pageProps, router, ...props }: MyAppProps) {
  return (
    <>
      {process.env.NODE_ENV === "development" ? null : (
        <>
          <GoogleAnalytics />
          <Hubspot />
          <Hotjar />
        </>
      )}
      <I18nProvider {...props}>
        <ChakraProvider theme={theme}>
          {/* Force light mode until a fix is found for the server vs client discrepancies */}
          <CSSReset />
          <DndProvider backend={HTML5Backend}>
            <DialogOpenerProvider>
              <Component {...pageProps} />
            </DialogOpenerProvider>
          </DndProvider>
        </ChakraProvider>
      </I18nProvider>
    </>
  );
}

export default MyApp;
