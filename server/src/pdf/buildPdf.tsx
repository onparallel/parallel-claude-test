import { renderToStream } from "@react-pdf/renderer";
import { ComponentType, createElement } from "react";
import { IntlProvider } from "react-intl";
import { loadMessages } from "../util/loadMessages";

export interface PdfOptions {
  locale: string;
}

export async function buildPdf<T>(document: ComponentType<T>, props: T, { locale }: PdfOptions) {
  const messages = await loadMessages(locale);
  const intlProps = {
    messages,
    locale,
    defaultRichTextElements: {},
  };
  return await renderToStream(
    <IntlProvider {...intlProps}>{createElement(document, props)}</IntlProvider>
  );
}
