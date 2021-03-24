import { I18nProps } from "@parallel/components/common/I18nProvider";
import languages from "@parallel/lang/languages.json";
import { promises as fs } from "fs";
import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";
import { IntlConfig } from "react-intl";

const LANG_DIR = process.env.ROOT + "/public/static/lang";

const messagesCache: Record<string, IntlConfig["messages"]> = {};
async function loadMessages(locale: string) {
  if (!(locale in messagesCache)) {
    const messages = await fs.readFile(LANG_DIR + `/compiled/${locale}.json`, {
      encoding: "utf-8",
    });
    messagesCache[locale] = JSON.parse(messages) as IntlConfig["messages"];
  }
  return messagesCache[locale];
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
        enhanceApp: (App) => (props) => (
          <App {...props} {...{ locale, messages }} />
        ),
      });
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps, locale };
  }

  render() {
    const { locale } = this.props;
    return (
      <Html lang={locale}>
        <Head>
          <link href={process.env.NEXT_PUBLIC_ASSETS_URL} rel="preconnect" />
          <link href="https://polyfill.io" rel="preconnect" />
          <link
            rel="preload"
            href={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/lang/${locale}.js?v=${process.env.BUILD_ID}`}
            as="script"
            crossOrigin="anonymous"
          />
          <script
            src={`https://polyfill.io/v3/polyfill.min.js?features=${encodeURIComponent(
              [
                "requestAnimationFrame",
                "Array.prototype.flat",
                "Array.prototype.flatMap",
                "Object.fromEntries",
                ...[
                  "Intl.NumberFormat",
                  "Intl.DateTimeFormat",
                  "Intl.PluralRules",
                  "Intl.RelativeTimeFormat",
                ].flatMap((polyfill) => [
                  polyfill,
                  ...languages.map(
                    (lang) => `${polyfill}.~locale.${lang.locale}`
                  ),
                ]),
              ].join(",")
            )}`}
          />
        </Head>
        <body>
          <Main />
          <script
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/lang/${locale}.js?v=${process.env.BUILD_ID}`}
            crossOrigin="anonymous"
          />
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
