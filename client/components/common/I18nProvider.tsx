import { useRouter } from "next/router";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { IntlConfig, IntlProvider } from "react-intl";

const SetLocaleProvider = createContext<((locale: string) => void) | undefined>(
  undefined
);

export function useSetLocale() {
  return useContext(SetLocaleProvider)!;
}

export interface I18nProps {
  locale: string;
  messages: IntlConfig["messages"];
}

export interface IntlCache {
  current: string;
  cache: {
    [locale: string]: IntlConfig["messages"];
  };
}

export function I18nProvider({
  children,
  ...props
}: I18nProps & { children: ReactNode }) {
  const { locale, messages, setLocale } = process.browser
    ? useTranslations()
    : (props as I18nProps & { setLocale: undefined });
  return (
    <SetLocaleProvider.Provider value={setLocale}>
      <IntlProvider locale={locale} messages={messages}>
        {children}
      </IntlProvider>
    </SetLocaleProvider.Provider>
  );
}

function useTranslations() {
  const {
    query: { locale },
  } = useRouter();
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
  const setLocale = useCallback(async function (locale: string) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/lang/${locale}.json`
    );
    const messages = await res.json();
    setState(({ cache }) => ({
      current: locale,
      cache: {
        ...cache,
        [locale]: messages,
      },
    }));
  }, []);
  useEffect(() => {
    if (!locale) {
      return;
    } else if (!cache[locale as string]) {
      setLocale(locale as string);
    } else if (current !== locale) {
      setState({ current: locale as string, cache });
    }
  }, [cache, locale]);
  return { locale: current, messages: cache[current], setLocale };
}
