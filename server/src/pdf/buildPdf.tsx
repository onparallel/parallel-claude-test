import { renderToStream, Font } from "@react-pdf/renderer";
import { createElement } from "react";
import { IntlProvider } from "react-intl";
import { loadMessages } from "../util/loadMessages";
import { PdfDocument, PdfDocumentGetPropsContext } from "./utils/pdf";
import fonts from "./utils/fonts.json";

const WHITELISTED_FONTS = [
  "Roboto Slab",
  "Merriweather",
  "Playfair Display",
  "Lora",
  "PT Serif",
  "Source Serif Pro",
  "IBM Plex Serif",
  "Cormorant Garamond",
  "Alegreya",
  "Tinos",
  "Libre Baskerville",
  "Noto Serif",
  "Roboto",
  "Open Sans",
  "IBM Plex Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Source Sans Pro",
  "Noto Sans",
  "Raleway",
  "Nunito",
  "Rubik",
  "Parisienne",
  "Rubik Wet Paint",
  "Inconsolata",
];

// get json from https://developers.google.com/fonts/docs/developer_api?apix_params=%7B%22fields%22%3A%22items.files%2Citems.family%2Citems.kind%2Citems.category%22%7D
for (const font of fonts.items as { family: string; files: Record<string, string> }[]) {
  if (WHITELISTED_FONTS.includes(font.family)) {
    Font.register({
      family: font.family,
      fonts: Object.entries(font.files).map(([key, url]) => {
        if (key === "regular") {
          return { src: url };
        } else if (key === "italic") {
          return { src: url, fontStyle: "italic" };
        } else {
          const match = key.match(/^(\d{3})(italic)?$/);
          if (match) {
            const [_, fontWeight, italic] = match;
            return { src: url, fontStyle: italic, fontWeight: parseInt(fontWeight) };
          } else {
            throw "Unhandled font definition";
          }
        }
      }),
    });
  }
}

Font.registerEmojiSource({
  format: "png",
  url: "https://twemoji.maxcdn.com/2/72x72/",
});

export async function buildPdf<ID, P>(
  document: PdfDocument<ID, P>,
  initial: ID,
  context: PdfDocumentGetPropsContext
) {
  const messages = await loadMessages(context.locale);
  const props = document.getProps ? await document.getProps(initial, context) : initial;
  const intlProps = { messages, locale: context.locale, defaultRichTextElements: {} };
  return await renderToStream(
    <IntlProvider {...intlProps}>{createElement(document, props as any)}</IntlProvider>
  );
}
