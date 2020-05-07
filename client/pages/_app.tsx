import {
  ColorModeProvider,
  CSSReset,
  ITheme,
  ThemeProvider,
} from "@chakra-ui/core";
import { DialogOpenerProvider } from "@parallel/components/common/DialogOpenerProvider";
import {
  I18nProps,
  I18nProvider,
} from "@parallel/components/common/I18nProvider";
import { GoogleAnalytics } from "@parallel/components/scripts/GoogleAnalytics";
import { Hotjar } from "@parallel/components/scripts/Hotjar";
import { Hubspot } from "@parallel/components/scripts/Hubspot";
import { theme } from "@parallel/utils/theme";
import { AppProps } from "next/app";
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";

const resetConfig = (theme: ITheme) => ({
  light: {
    color: theme.colors.gray[700],
    bg: theme.colors.white,
    borderColor: theme.colors.gray[200],
    placeholderColor: theme.colors.gray[500],
  },
  dark: {
    color: theme.colors.whiteAlpha[900],
    bg: theme.colors.gray[800],
    borderColor: theme.colors.whiteAlpha[300],
    placeholderColor: theme.colors.whiteAlpha[400],
  },
});

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
        <ThemeProvider theme={theme}>
          <ColorModeProvider value="light">
            {/* Force light mode until a fix is found for the server vs client discrepancies */}
            <CSSReset config={resetConfig} />
            <DndProvider backend={Backend}>
              <DialogOpenerProvider>
                <Component {...pageProps} />
              </DialogOpenerProvider>
            </DndProvider>
          </ColorModeProvider>
        </ThemeProvider>
      </I18nProvider>
    </>
  );
}

export default MyApp;
