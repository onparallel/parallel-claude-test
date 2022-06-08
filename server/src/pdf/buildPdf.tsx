import { renderToStream, Font } from "@react-pdf/renderer";
import { createElement } from "react";
import { IntlConfig, IntlProvider } from "react-intl";
import { loadMessages } from "../util/loadMessages";
import { PdfDocument, PdfDocumentGetPropsContext } from "./utils/pdf";
import families from "./utils/fonts.json";

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
                    font.fontWeight === 400
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

export async function buildPdf<ID, P>(
  document: PdfDocument<ID, P>,
  initial: ID,
  context: PdfDocumentGetPropsContext
) {
  if (!hasInit) {
    init();
    hasInit = true;
  }
  const messages = await loadMessages(context.locale);
  const props = document.getProps ? await document.getProps(initial, context) : initial;
  const intlProps: IntlConfig = {
    messages,
    locale: context.locale,
    defaultRichTextElements: {},
    onWarn: () => {},
  };
  return await renderToStream(
    <IntlProvider {...intlProps}>{createElement(document, props as any)}</IntlProvider>
  );
}
