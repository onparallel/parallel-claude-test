import { promises as fs } from "fs";
import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";
import { IntlConfig } from "react-intl";
import { LangProps } from "./_app";

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

type MyDocumentProps = LangProps;

class MyDocument extends Document<MyDocumentProps> {
  static async getInitialProps(ctx: DocumentContext) {
    const { req, res, ...rest } = ctx;
    const { query, renderPage } = ctx;
    const locale = query.locale ?? "en";
    const { raw, compiled } = await loadMessages(locale as string);
    ctx.renderPage = () =>
      renderPage({
        enhanceApp: (App) => (props) => (
          <App {...props} {...{ locale, messages: compiled }}></App>
        ),
      });
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
            href="https://fonts.googleapis.com/css?family=IBM+Plex+Sans:300,400,600|Playfair+Display&display=swap"
          />
          <script
            src={`https://polyfill.io/v3/polyfill.min.js?features=${encodeURIComponent(
              [
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

export default MyDocument;
