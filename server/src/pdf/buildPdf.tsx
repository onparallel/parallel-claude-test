import { renderToStream, Font } from "@react-pdf/renderer";
import { createElement } from "react";
import { IntlProvider } from "react-intl";
import { loadMessages } from "../util/loadMessages";
import { PdfDocument, PdfDocumentGetPropsContext } from "./utils/pdf";

// get ttf links from https://developers.google.com/fonts/docs/developer_api
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "http://fonts.gstatic.com/s/roboto/v29/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf",
    },
    {
      src: "http://fonts.gstatic.com/s/roboto/v29/KFOkCnqEu92Fr1Mu52xPKTM1K9nz.ttf",
      fontStyle: "italic",
    },
    {
      src: "http://fonts.gstatic.com/s/roboto/v29/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf",
      fontWeight: "bold",
    },
    {
      src: "http://fonts.gstatic.com/s/roboto/v29/KFOjCnqEu92Fr1Mu51TzBhc9AMX6lJBP.ttf",
      fontStyle: "italic",
      fontWeight: "bold",
    },
  ],
});

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
