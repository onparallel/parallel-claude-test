import { I18nProps } from "@parallel/components/common/I18nProvider";
import languages from "@parallel/lang/languages.json";
import { promises as fs } from "fs";
import Document, { DocumentContext, Head, Html, Main, NextScript } from "next/document";
import { outdent } from "outdent";
import { IntlConfig } from "react-intl";

const LANG_DIR = process.env.ROOT + "/public/static/lang";

const messagesCache: Record<string, IntlConfig["messages"]> = {};
async function loadMessages(locale: string): Promise<IntlConfig["messages"]> {
  if (process.env.NODE_ENV !== "production") {
    // on development load /lang files
    const messages = await fs.readFile(process.env.ROOT + `/lang/${locale}.json`, {
      encoding: "utf-8",
    });
    return Object.fromEntries<string>(JSON.parse(messages).map((t: any) => [t.term, t.definition]));
  } else {
    if (!(locale in messagesCache)) {
      // on production load compiled files
      const messages = await fs.readFile(LANG_DIR + `/compiled/${locale}.json`, {
        encoding: "utf-8",
      });
      messagesCache[locale] = JSON.parse(messages);
    }
    return messagesCache[locale];
  }
}

type MyDocumentProps = I18nProps;

class MyDocument extends Document<MyDocumentProps> {
  static async getInitialProps(ctx: DocumentContext) {
    const { renderPage } = ctx;
    const locale = getLocale(ctx);
    if (locale === null) {
      ctx.res!.writeHead(302, { Location: "/" }).end();
      return {} as any;
    }
    const messages = await loadMessages(locale);
    ctx.renderPage = () =>
      renderPage({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        enhanceApp: (App) => (props) => <App {...props} {...{ locale, messages }} />,
      });
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps, locale, messages };
  }

  render() {
    const { locale, messages } = this.props;
    const polyfillsUrl = `https://polyfill.io/v3/polyfill.min.js?features=${encodeURIComponent(
      [
        "matchMedia",
        "requestAnimationFrame",
        "Array.prototype.flat",
        "Array.prototype.flatMap",
        "Object.fromEntries",
        ...[
          "Intl.ListFormat",
          "Intl.NumberFormat",
          "Intl.DateTimeFormat",
          "Intl.PluralRules",
          "Intl.RelativeTimeFormat",
        ].flatMap((polyfill) => [
          polyfill,
          ...languages.map((lang) => `${polyfill}.~locale.${lang.locale}`),
        ]),
      ].join(",")
    )}`;
    const localeDataUrl = `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/lang/compiled/${locale}.js?v=${process.env.BUILD_ID}`;
    return (
      <Html lang={locale}>
        <Head>
          <link href={process.env.NEXT_PUBLIC_ASSETS_URL} rel="preconnect" />
          <link href={polyfillsUrl} rel="preload" as="script" crossOrigin="anonymous" />
          {process.env.NODE_ENV === "production" ? (
            <link href={localeDataUrl} rel="preload" as="script" crossOrigin="anonymous" />
          ) : null}
          {(
            [
              ["ibm-plex-sans-v8-latin", ["300", "regular", "500", "600"]],
              ["source-sans-pro-v14-latin", ["regular", "600"]],
            ] as [string, string[]][]
          ).flatMap(([name, types]) =>
            types.map((type) => (
              <link
                key={`${name}-${type}`}
                rel="preload"
                href={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/fonts/${name}-${type}.woff2`}
                as="font"
                crossOrigin="anonymous"
              />
            ))
          )}
        </Head>
        <body>
          <Main />
          <script src={polyfillsUrl} crossOrigin="anonymous" />
          {process.env.NODE_ENV === "production" ? (
            <script src={localeDataUrl} crossOrigin="anonymous" />
          ) : (
            <script
              dangerouslySetInnerHTML={{
                __html: outdent`
                  window.__LOCALE__ = "${locale}";
                  window.__LOCALE_DATA__ = ${JSON.stringify(messages)};
                `,
              }}
            />
          )}
          <NextScript />
        </body>
      </Html>
    );
  }
}

function getLocale(context: DocumentContext) {
  if (context.query.locale) {
    const locale = context.query.locale as string;
    if (locale && languages.some((l) => l.locale === locale)) {
      return locale;
    }
    return null;
  } else {
    if (context.req?.url) {
      const match = context.req?.url.match(/^\/([a-z-]*)\//i);
      const locale = match?.[1]?.toLowerCase();
      if (locale && languages.some((l) => l.locale === locale)) {
        return locale;
      }
    }
    return "en";
  }
}

export default MyDocument;
