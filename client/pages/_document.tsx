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
import { logger } from "@parallel/utils/logger";

const LANG_DIR = process.env.ROOT + "/public/static/lang";

export async function loadMessages(
  locale: string
): Promise<IntlConfig["messages"]> {
  const [raw, compiled] = await Promise.all([
    fs.readFile(LANG_DIR + `/${locale}.json`, {
      encoding: "utf-8",
    }),
    fs.readFile(LANG_DIR + `/compiled/${locale}.json`, {
      encoding: "utf-8",
    }),
  ]);
  return { raw: JSON.parse(raw), compiled: JSON.parse(compiled) };
}

type MyDocumentProps = I18nProps;

class MyDocument extends Document<MyDocumentProps> {
  static async getInitialProps(ctx: DocumentContext) {
    const { renderPage } = ctx;
    const locale = getLocale(ctx);
    const { raw, compiled } = await loadMessages(locale);
    ctx.renderPage = () => {
      try {
        return renderPage({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          enhanceApp: (App) => (props) => (
            <App {...props} {...{ locale, messages: compiled }} />
          ),
        });
      } catch (error) {
        logger.error(error.stack, { error });
        throw error;
      }
    };
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps, locale, messages: raw };
  }

  render() {
    const { locale, messages } = this.props;
    return (
      <Html lang={locale}>
        <Head>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=IBM+Plex+Sans:300,400,500,600|Playfair+Display&display=swap"
          />
          <script
            src={`https://polyfill.io/v3/polyfill.min.js?features=${encodeURIComponent(
              [
                "Object.fromEntries",
                "Intl.PluralRules",
                "Intl.PluralRules.~locale.es",
                "Intl.PluralRules.~locale.en",
                "Intl.RelativeTimeFormat",
                "Intl.RelativeTimeFormat.~locale.es",
                "Intl.RelativeTimeFormat.~locale.en",
              ].join(",")
            )}`}
          />
        </Head>
        <body>
          <Main />
          <script
            id="__LANG_DATA__"
            type="application/json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({ locale, messages }),
            }}
          />
          <NextScript />
        </body>
      </Html>
    );
  }
}

function getLocale(context: DocumentContext) {
  if (context.query.locale) {
    return context.query.locale as string;
  } else {
    if (context.req?.url) {
      const match = context.req?.url.match(/^\/([a-z-]*)\//i);
      const locale = match?.[1]?.toLowerCase();
      if (locale && languages.some((l) => l.locale === locale)) {
        return locale;
      }
    }
  }
  return "en";
}

export default MyDocument;
