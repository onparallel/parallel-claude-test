import { render } from "mjml-react";
import { ReactElement } from "react";
import { IntlProvider } from "react-intl";
import {
  default as ForgotPassword,
  ForgotPasswordProps
} from "./emails/ForgotPassword";

export interface EmailOptions {
  locale: string;
}

async function buildEmail(locale: string, component: ReactElement) {
  const messages = await import(`./lang/compiled/${locale}.json`);
  const { html } = render(
    <IntlProvider locale={locale} messages={messages}>
      {component}
    </IntlProvider>,
    {
      keepComments: false,
      beautify: false,
      minify: true,
      validationLevel: "skip"
    }
  );
  return html;
}

export async function forgotPassword(
  props: ForgotPasswordProps,
  { locale }: EmailOptions
) {
  return await buildEmail(locale, <ForgotPassword {...props} />);
}
