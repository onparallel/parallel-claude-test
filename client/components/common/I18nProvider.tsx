import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { IntlConfig, IntlProvider } from "react-intl";
import { noop } from "ts-essentials";

export interface I18nProps {
  locale: string;
  messages: IntlConfig["messages"];
  isRecipientPage: boolean;
}

export interface IntlCache {
  current: string;
  cache: {
    [locale: string]: IntlConfig["messages"];
  };
}

const defaultRichTextElements = {
  b: (chunks: any) => <strong>{chunks}</strong>,
};

export function I18nProvider({ children, ...props }: I18nProps & { children: ReactNode }) {
  const { locale, messages } =
    typeof window !== "undefined" ? useTranslations(props.isRecipientPage) : (props as I18nProps);
  return (
    <IntlProvider
      locale={locale}
      messages={messages}
      defaultRichTextElements={defaultRichTextElements}
      onWarn={noop}
    >
      {children}
    </IntlProvider>
  );
}

function useTranslations(isRecipientPage: boolean) {
  const { locale } = useRouter();
  const [{ current, cache }, setState] = useState<IntlCache>(() => {
    const locale = (window as any).__LOCALE__ as string;
    const messages = (window as any).__LOCALE_DATA__ as IntlConfig["messages"];
    return {
      current: locale,
      cache: { [locale]: messages },
    };
  });
  useEffect(() => {
    async function setLocale(locale: string) {
      let messages: IntlConfig["messages"];
      if (process.env.NODE_ENV === "production") {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/lang` +
            (isRecipientPage ? "/recipient" : "") +
            `/compiled/${locale}.json?v=${process.env.BUILD_ID}`,
        );
        messages = await res.json();
      } else {
        const { default: data } = await import(
          "@parallel/lang" + (isRecipientPage ? "/recipient" : "") + `/${locale}.json`
        );
        messages = Object.fromEntries<string>(data.map((t: any) => [t.term, t.definition]));
      }
      setState(({ cache }) => ({
        current: locale,
        cache: {
          ...cache,
          [locale]: messages,
        },
      }));
    }
    if (!locale) {
      return;
    } else if (!cache[locale as string]) {
      setLocale(locale as string);
    } else if (current !== locale) {
      setState({ current: locale as string, cache });
    }
  }, [cache, locale]);
  return { locale: current, messages: cache[current] };
}
