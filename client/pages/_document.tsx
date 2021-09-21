import { I18nProps } from "@parallel/components/common/I18nProvider";
import languages from "@parallel/lang/languages.json";
import { promises as fs } from "fs";
import Document, { DocumentContext, Head, Html, Main, NextScript } from "next/document";
import { outdent } from "outdent";
import { IntlConfig } from "react-intl";
import { isDefined } from "remeda";

const MESSAGES_CACHE = new Map<string, IntlConfig["messages"]>();

async function loadMessages(locale: string): Promise<IntlConfig["messages"]> {
  if (process.env.NODE_ENV !== "production") {
    // on development load uncompiled files for faster dev cycle
    const path = process.env.ROOT + `/lang/${locale}.json`;
    const messages = await fs.readFile(path, { encoding: "utf-8" });
    return Object.fromEntries<string>(JSON.parse(messages).map((t: any) => [t.term, t.definition]));
  } else {
    if (!MESSAGES_CACHE.has(locale)) {
      // on production load compiled files
      const path = process.env.ROOT + `/public/static/lang/compiled/${locale}.json`;
      const messages = await fs.readFile(path, { encoding: "utf-8" });
      MESSAGES_CACHE.set(locale, JSON.parse(messages));
    }
    return MESSAGES_CACHE.get(locale)!;
  }
}

const POLYFILLS = [
  "matchMedia",
  "requestAnimationFrame",
  "Array.prototype.flat",
  "Array.prototype.flatMap",
  "Object.fromEntries",
];

const POLYFILLS_INTL = [
  "Intl.ListFormat",
  "Intl.NumberFormat",
  "Intl.DateTimeFormat",
  "Intl.PluralRules",
  "Intl.RelativeTimeFormat",
];

type MyDocumentProps = I18nProps;

class MyDocument extends Document<MyDocumentProps> {
  static async getInitialProps(ctx: DocumentContext) {
    const { renderPage, locale } = ctx;
    if (!isDefined(locale)) {
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
        ...POLYFILLS,
        ...POLYFILLS_INTL.flatMap((polyfill) => [polyfill, `${polyfill}.~locale.${locale}`]),
      ].join(",")
    )}`;
    const polyfillsUrlIntl = `https://polyfill.io/v3/polyfill.min.js?features=${encodeURIComponent(
      POLYFILLS_INTL.flatMap((polyfill) =>
        languages
          .filter((lang) => lang.locale !== locale)
          .map((lang) => `${polyfill}.~locale.${lang.locale}`)
      ).join(",")
    )}`;
    const localeDataUrl = `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/lang/compiled/${locale}.js?v=${process.env.BUILD_ID}`;
    return (
      <Html>
        <Head>
          <link href={process.env.NEXT_PUBLIC_ASSETS_URL} rel="preconnect" />
          <link href={polyfillsUrl} rel="preload" as="script" crossOrigin="anonymous" />
          {process.env.NODE_ENV === "production" ? (
            <link href={localeDataUrl} rel="preload" as="script" crossOrigin="anonymous" />
          ) : null}
          {(
            [
              ["ibm-plex-sans-v8-latin", ["regular", "600"]],
              ["source-sans-pro-v14-latin", ["600"]],
            ] as [string, string[]][]
          ).flatMap(([name, types]) =>
            types.map((type) => (
              <link
                key={`${name}-${type}`}
                rel="preload"
                href={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/fonts/${name}-${type}.woff2`}
                as="font"
                type="font/woff2"
                crossOrigin="anonymous"
              />
            ))
          )}
        </Head>
        <body>
          <Main />
          <script src={polyfillsUrl} crossOrigin="anonymous" />
          <script src={polyfillsUrlIntl} async defer crossOrigin="anonymous" />
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

export default MyDocument;
