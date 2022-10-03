import { render } from "mjml-react";
import { ComponentType, createElement } from "react";
import { createIntl, IntlConfig, IntlProvider, IntlShape } from "react-intl";
import { loadMessages } from "../util/loadMessages";

export interface EmailOptions {
  locale: string;
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
  { locale }: EmailOptions
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
  const { html } = render(
    <IntlProvider {...intlProps}>{createElement<T>(email.html, props)}</IntlProvider>,
    {
      keepComments: false,
      minify: true,
      validationLevel: "skip",
    }
  );
  const intl = createIntl(intlProps);
  const text = email.text(props, intl);
  const subject = email.subject(props, intl);
  const from = email.from(props, intl);
  return { html, text, subject, from };
}
