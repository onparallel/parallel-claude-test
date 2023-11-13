import { renderToStream, Font } from "@react-pdf/renderer";
import { createElement } from "react";
import { IntlConfig, IntlProvider } from "react-intl";
import { loadMessages } from "../util/loadMessages";
import { PdfDocument, PdfDocumentGetPropsContext } from "./utils/pdf";
import families from "./utils/fonts.json";
import { ContactLocale } from "../db/__types";
import hyphen from "hyphen";
import { isDefined } from "remeda";

let hasInit = false;

function init() {
  for (const f of families) {
    const fonts = f.fonts.map((font) => ({
      ...font,
      src: `${process.env.ASSETS_URL!}/static/fonts/pdf/${encodeURIComponent(f.family)}/${
        font.src
      }`,
    }));
    Font.register({
      family: f.family,
      fonts: [
        ...fonts,
        // Add fallback for fonts with missing italic style
        ...(fonts.some((font) => font.fontStyle === "italic")
          ? []
          : [
              {
                ...fonts.find(
                  (font) =>
                    (font.fontStyle !== "italic" && font.fontWeight === undefined) ||
                    font.fontWeight === 400,
                )!,
                fontStyle: "italic",
              },
            ]),
      ],
    });
  }

  Font.registerEmojiSource({
    format: "png",
    url: "https://twemoji.maxcdn.com/2/72x72/",
  });
}

async function createHyphenationCallback(locale: ContactLocale) {
  const pattern =
    locale === "en"
      ? await import("hyphen/patterns/en-us")
      : locale === "es"
        ? await import("hyphen/patterns/es")
        : (null as never);
  const SOFT_HYPHEN = "\u00ad";
  const hyphenator = hyphen(pattern);
  const splitHyphen = (word: string) => word.split(SOFT_HYPHEN);
  const cache = new Map<string, string[]>();

  return (word: string | null) => {
    if (!isDefined(word)) {
      return [];
    }
    if (!cache.has(word)) {
      const splitted = word.includes(SOFT_HYPHEN)
        ? splitHyphen(word)
        : splitHyphen(hyphenator(word) as string);
      cache.set(word, splitted);
      return splitted;
    }
    return cache.get(word)!;
  };
}

export async function buildPdf<ID, P extends {}>(
  document: PdfDocument<ID, P>,
  initial: ID,
  context: PdfDocumentGetPropsContext,
) {
  if (!hasInit) {
    init();
    hasInit = true;
  }
  Font.registerHyphenationCallback(await createHyphenationCallback(context.locale ?? "en"));
  const messages = await loadMessages(context.locale);
  const props = document.getProps ? await document.getProps(initial, context) : initial;
  const intlProps: IntlConfig = {
    messages,
    locale: context.locale,
    defaultRichTextElements: {},
    onWarn: () => {},
  };
  return await renderToStream(
    <IntlProvider {...intlProps}>{createElement<P>(document, props as any)}</IntlProvider>,
  );
}
