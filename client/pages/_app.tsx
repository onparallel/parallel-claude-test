import {
  ColorModeProvider,
  CSSReset,
  GlobalStyle,
  PortalManager,
  ThemeProvider,
} from "@chakra-ui/core";
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
        {/* Change for ChakraProvider when this gets merged https://github.com/chakra-ui/chakra-ui/issues/1394 */}
        <ThemeProvider theme={theme}>
          <ColorModeProvider
            defaultValue={theme?.config?.initialColorMode}
            useSystemColorMode={theme?.config?.useSystemColorMode}
          >
            <GlobalStyle />
            <CSSReset />
            <PortalManager zIndex={40}>
              <DndProvider backend={HTML5Backend}>
                <DialogOpenerProvider>
                  <Component {...pageProps} />
                </DialogOpenerProvider>
              </DndProvider>
            </PortalManager>
          </ColorModeProvider>
        </ThemeProvider>
      </I18nProvider>
    </>
  );
}

export default MyApp;
