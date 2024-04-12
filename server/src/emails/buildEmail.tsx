import { render } from "@faire/mjml-react/utils/render";
import htmlnano from "htmlnano";
import { ComponentType, createElement } from "react";
import { IntlConfig, IntlProvider, IntlShape, createIntl } from "react-intl";
import { ContactLocale, UserLocale } from "../db/__types";
import { loadMessages } from "../util/loadMessages";

export interface EmailOptions {
  locale: ContactLocale | UserLocale;
}

export interface Email<T extends {}> {
  from: (props: T, intl: IntlShape) => string;
  subject: (props: T, intl: IntlShape) => string;
  text: (props: T, intl: IntlShape) => string;
  html: ComponentType<T>;
}

export async function buildEmail<T extends {}>(
  email: Email<T>,
  props: T,
  { locale }: EmailOptions,
) {
  const messages = await loadMessages(locale);
  const intlProps: IntlConfig = {
    messages,
    locale,
    defaultRichTextElements: {
      b: (chunks: any) => <strong>{chunks}</strong>,
    },
    onWarn: () => {},
  };
  const intl = createIntl(intlProps);
  const subject = email.subject(props, intl);
  const text = email.text(props, intl);
  const from = email.from(props, intl);
  let html: string;
  if (subject.includes("htmlnanotest")) {
    const result = render(
      <IntlProvider {...intlProps}>{createElement<T>(email.html, props)}</IntlProvider>,
      {
        keepComments: false,
        minify: false,
        validationLevel: "skip",
      },
    );
    const minified = await htmlnano.process(
      result.html,
      { mergeStyles: true, minifyCss: false },
      htmlnano.presets.safe,
    );
    html = minified.html;
  } else {
    const result = render(
      <IntlProvider {...intlProps}>{createElement<T>(email.html, props)}</IntlProvider>,
      {
        keepComments: false,
        minify: true,
        validationLevel: "skip",
      },
    );
    html = result.html;
  }
  return { html, text, subject, from };
}
