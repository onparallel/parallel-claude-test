import { useRouter } from "next/router";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { IntlConfig, IntlProvider } from "react-intl";

const SetLocaleProvider = createContext<((locale: string) => void) | undefined>(undefined);

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

export function I18nProvider({ children, ...props }: I18nProps & { children: ReactNode }) {
  const { locale, messages, setLocale } =
    typeof window !== "undefined"
      ? useTranslations()
      : (props as I18nProps & { setLocale: undefined });
  return (
    <SetLocaleProvider.Provider value={setLocale}>
      <IntlProvider
        locale={locale}
        messages={messages}
        defaultRichTextElements={{
          b: (chunks: any) => <strong>{chunks}</strong>,
        }}
      >
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
    const locale = (window as any).__LOCALE__ as string;
    const messages = (window as any).__LOCALE_DATA__ as IntlConfig["messages"];
    return {
      current: locale,
      cache: {
        [locale]: messages,
      },
    };
  });
  const setLocale = useCallback(async function (locale: string) {
    let messages: IntlConfig["messages"];
    if (process.env.NODE_ENV === "production") {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/lang/compiled/${locale}.json?v=${process.env.BUILD_ID}`
      );
      messages = await res.json();
    } else {
      const { default: data } = await import(`@parallel/lang/${locale}.json`);
      messages = Object.fromEntries<string>(data.map((t: any) => [t.term, t.definition]));
    }
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
