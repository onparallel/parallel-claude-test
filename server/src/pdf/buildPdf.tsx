import { Font, renderToStream } from "@react-pdf/renderer";
import hyphen from "hyphen";
import { createElement } from "react";
import { IntlConfig, IntlProvider } from "react-intl";
import { isNullish } from "remeda";
import { ContactLocale } from "../db/__types";
import { loadMessages } from "../util/loadMessages";
import fonts from "./utils/fonts.json";
import internationalFonts from "./utils/international_fonts.json";
import { PdfDocument, PdfDocumentGetPropsContext } from "./utils/pdf";

let hasInit = false;

function init() {
  const families = [...internationalFonts, ...fonts] as {
    family: string;
    fonts: { src: string; fontStyle: "italic"; fontWeight: number }[];
  }[];
  for (const f of families) {
    const fonts = f.fonts.map((font) => ({
      ...font,
      fontWeight: font.fontWeight ?? 400,
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
    url: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/",
  });
}

async function createHyphenationCallback(locale: ContactLocale) {
  let pattern;
  switch (locale) {
    case "en":
      pattern = await import("hyphen/patterns/en-us");
      break;
    case "es":
      pattern = await import("hyphen/patterns/es");
      break;
    case "it":
      pattern = await import("hyphen/patterns/it");
      break;
    case "pt":
      pattern = await import("hyphen/patterns/pt");
      break;
    case "ca":
      pattern = await import("hyphen/patterns/ca");
      break;
    default:
      pattern = null as never;
      break;
  }
  const SOFT_HYPHEN = "\u00ad";
  const hyphenator = hyphen(pattern);
  const splitHyphen = (word: string) => word.split(SOFT_HYPHEN);
  const cache = new Map<string, string[]>();

  return (word: string | null) => {
    if (isNullish(word)) {
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
