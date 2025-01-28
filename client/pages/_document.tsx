import { I18nProps } from "@parallel/components/common/I18nProvider";
import { Canny } from "@parallel/components/scripts/Canny";
import { Segment } from "@parallel/components/scripts/Segment";
import { csp } from "@parallel/utils/csp";
import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import Document, {
  DocumentContext,
  DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";
import { outdent } from "outdent";
import { IntlConfig } from "react-intl";
import { isNullish } from "remeda";
import type { MyAppProps } from "./_app";

const MESSAGES_CACHE = new Map<string, IntlConfig["messages"]>();

async function loadMessages(locale: string, isRecipient: boolean): Promise<IntlConfig["messages"]> {
  if (process.env.NODE_ENV !== "production") {
    // on development load uncompiled files for faster dev cycle
    const path =
      process.env.ROOT +
      "/lang" +
      (isRecipient && !["en", "es"].includes(locale) ? "/recipient" : "") +
      `/${locale}.json`;
    const messages = await fs.readFile(path, { encoding: "utf-8" });
    return Object.fromEntries<string>(JSON.parse(messages).map((t: any) => [t.term, t.definition]));
  } else {
    // on production load compiled files
    const path =
      process.env.ROOT +
      "/public/static/lang" +
      (isRecipient ? "/recipient" : "") +
      `/compiled/${locale}.json`;
    if (!MESSAGES_CACHE.has(path)) {
      const messages = await fs.readFile(path, { encoding: "utf-8" });
      MESSAGES_CACHE.set(path, JSON.parse(messages));
    }
    return MESSAGES_CACHE.get(path)!;
  }
}

const POLYFILLS = ["matchMedia", "requestAnimationFrame", "IntersectionObserver"];

const POLYFILLS_INTL = [
  "Intl.ListFormat",
  "Intl.NumberFormat",
  "Intl.DateTimeFormat",
  "Intl.PluralRules",
  "Intl.RelativeTimeFormat",
];

interface MyDocumentProps extends I18nProps {
  isAppPage: boolean;
  nonce: string;
}

class MyDocument extends Document<MyDocumentProps> {
  static override async getInitialProps(
    ctx: DocumentContext,
  ): Promise<DocumentInitialProps & MyDocumentProps> {
    const { renderPage, locale } = ctx;
    const isRecipientPage =
      ["/maintenance", "/thanks", "/update", "/404"].includes(ctx.pathname) ||
      ["/petition/", "/pp/"].some((prefix) => ctx.pathname.startsWith(prefix));
    const isAppPage =
      ["/app"].includes(ctx.pathname) ||
      ["/app/"].some((prefix) => ctx.pathname.startsWith(prefix));
    if (isNullish(locale)) {
      ctx.res!.writeHead(302, { Location: "/" }).end();
      return { html: "" } as any;
    } else if (!isRecipientPage && !["en", "es"].includes(locale)) {
      ctx.res!.writeHead(302, { Location: ctx.asPath }).end();
      return { html: "" } as any;
    }
    const messages = await loadMessages(locale, isRecipientPage);
    const nonce = randomBytes(64).toString("base64");
    csp(ctx, nonce);
    ctx.renderPage = () =>
      renderPage({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        enhanceApp: (App) => (props) => (
          <App
            {...({
              ...props,
              locale,
              messages,
              isRecipientPage,
              cookie: ctx.req?.headers["cookie"] ?? null,
            } as MyAppProps)}
          />
        ),
      });
    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      locale,
      messages,
      isRecipientPage,
      isAppPage,
      nonce,
    };
  }

  override render() {
    const { locale, messages, isRecipientPage, isAppPage, nonce } = this.props;
    const polyfillsUrl = `https://cdnjs.cloudflare.com/polyfill/v3/polyfill.min.js?features=${encodeURIComponent(
      [
        ...POLYFILLS,
        ...POLYFILLS_INTL.flatMap((polyfill) => [polyfill, `${polyfill}.~locale.${locale}`]),
      ].join(","),
    )}`;
    const localeDataUrl = `${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/lang/${
      isRecipientPage ? "recipient/" : ""
    }compiled/${locale}.js?v=${process.env.BUILD_ID}`;
    return (
      <Html>
        <Head>
          <link href={process.env.NEXT_PUBLIC_IMAGES_URL} rel="preconnect" />
          {process.env.NEXT_PUBLIC_ASSETS_URL ? (
            <link href={process.env.NEXT_PUBLIC_ASSETS_URL} rel="preconnect" />
          ) : null}
          {isAppPage && process.env.NODE_ENV !== "development" ? (
            <>
              <link href="https://cdn.segment.com" rel="preconnect" crossOrigin="anonymous" />
            </>
          ) : null}
          <link href={polyfillsUrl} rel="preload" as="script" crossOrigin="anonymous" />
          {process.env.NODE_ENV === "production" ? (
            <link href={localeDataUrl} rel="preload" as="script" crossOrigin="anonymous" />
          ) : null}
          {(
            [["ibm-plex-sans-v8-latin", ["regular", "500", "600"]]] as [string, string[]][]
          ).flatMap(([name, types]) =>
            types.map((type) => (
              <link
                key={`${name}-${type}`}
                rel="preload"
                href={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/fonts/${name}-${type}.woff2`}
                as="font"
                type="font/woff2"
                crossOrigin="anonymous"
              />
            )),
          )}
        </Head>
        <body>
          {isAppPage && process.env.NODE_ENV !== "development" ? (
            <>
              <Segment nonce={nonce} />
              <Canny nonce={nonce} />
            </>
          ) : null}
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
          <NextScript nonce={nonce} />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
