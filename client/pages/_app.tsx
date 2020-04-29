import {
  ColorModeProvider,
  CSSReset,
  ITheme,
  ThemeProvider,
} from "@chakra-ui/core";
import { DialogOpenerProvider } from "@parallel/components/common/DialogOpenerProvider";
import { theme } from "@parallel/utils/theme";
import { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import { IntlConfig, IntlProvider } from "react-intl";
import { pick } from "remeda";
import { Hubspot } from "@parallel/components/scripts/Hubspot";
import { GoogleAnalytics } from "@parallel/components/scripts/GoogleAnalytics";
import { Hotjar } from "@parallel/components/scripts/Hotjar";

const resetConfig = (theme: ITheme) => ({
  light: {
    color: theme.colors.gray[700],
    bg: theme.colors.white,
    borderColor: theme.colors.gray[200],
    placeholderColor: theme.colors.gray[400],
  },
  dark: {
    color: theme.colors.whiteAlpha[900],
    bg: theme.colors.gray[800],
    borderColor: theme.colors.whiteAlpha[300],
    placeholderColor: theme.colors.whiteAlpha[400],
  },
});

export interface LangProps {
  locale: string;
  messages: IntlConfig["messages"];
}

export interface IntlCache {
  current: string;
  cache: {
    [locale: string]: IntlConfig["messages"];
  };
}

type MyAppProps = AppProps & LangProps;

function MyApp({ Component, pageProps, router, ...props }: MyAppProps) {
  const intlConfig = process.browser
    ? useTranslations(router.query.locale as string)
    : pick(props, ["locale", "messages"]);
  return (
    <>
      {process.env.NODE_ENV === "development" ? null : (
        <>
          <GoogleAnalytics />
          <Hubspot />
          <Hotjar />
        </>
      )}
      <IntlProvider {...intlConfig}>
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
      </IntlProvider>
    </>
  );
}

export function useTranslations(locale: string) {
  const [{ current, cache }, setState] = useState<IntlCache>(() => {
    const el = document.querySelector("#__LANG_DATA__");
    const { locale, messages } = JSON.parse(el!.firstChild!.nodeValue!);
    return {
      current: locale,
      cache: {
        [locale]: messages,
      },
    };
  });
  useEffect(() => {
    if (!locale) {
      return;
    } else if (!cache[locale]) {
      fetch(`${process.env.ASSETS_URL}/static/lang/${locale}.json`)
        .then((res) => res.json())
        .then((messages) => {
          setState({
            current: locale,
            cache: {
              ...cache,
              [locale]: messages,
            },
          });
        });
    } else if (current !== locale) {
      setState({ current: locale, cache });
    }
  }, [cache, locale]);
  return { locale: current, messages: cache[current] };
}

export default MyApp;
