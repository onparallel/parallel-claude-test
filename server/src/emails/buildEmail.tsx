import { render } from "mjml-react";
import { ComponentType, createElement } from "react";
import { IntlProvider, IntlShape, createIntl } from "react-intl";

export interface EmailOptions {
  locale: string;
}

export interface Email<T> {
  from: (props: T, intl: IntlShape) => string;
  subject: (props: T, intl: IntlShape) => string;
  text: (props: T, intl: IntlShape) => string;
  html: ComponentType<T>;
}

export async function buildEmail<T>(
  email: Email<T>,
  props: T,
  { locale }: EmailOptions
) {
  const messages = await import(`../../lang/compiled/${locale}.json`);
  const { html } = render(
    <IntlProvider locale={locale} messages={messages}>
      {createElement(email.html, props)}
    </IntlProvider>,
    {
      keepComments: false,
      minify: true,
      validationLevel: "skip",
    }
  );
  const intl = createIntl({ locale, messages });
  const text = email.text(props, intl);
  const subject = email.subject(props, intl);
  const from = email.from(props, intl);
  return { html, text, subject, from };
}
