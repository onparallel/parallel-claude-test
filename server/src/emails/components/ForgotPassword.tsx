import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage, IntlShape } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { Closing } from "../common/Closing";
import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";

export type ForgotPasswordProps = {
  name: string | null;
  resetUrl: string;
} & LayoutProps;

const email: Email<ForgotPasswordProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
    });
  },
  subject({}, intl) {
    return "";
  },
  text({ name, parallelUrl, resetUrl }: ForgotPasswordProps, intl: IntlShape) {
    return outdent``;
  },
  html({
    name,
    assetsUrl,
    parallelUrl,
    resetUrl,
    logoUrl,
    logoAlt,
  }: ForgotPasswordProps) {
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
      >
        <MjmlSection>
          <MjmlColumn>
            <Greeting name={name} />
            <MjmlText>
              <FormattedMessage
                id="forgot-password.click-to-reset"
                defaultMessage="Click on this link to reset your password:"
              />
            </MjmlText>
            <Button href={`${parallelUrl}${resetUrl}`}>
              <FormattedMessage
                id="forgot-password.reset-button"
                defaultMessage="Reset my password"
              />
            </Button>
            <MjmlText>
              <FormattedMessage
                id="forgot-password.ignore-text"
                defaultMessage="If you didn't request to change your password please ignore this email."
              />
            </MjmlText>
            <Closing />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};
export default email;

export const props: ForgotPasswordProps = {
  name: "Derek",
  assetsUrl: "http://localhost",
  parallelUrl: "http://localhost",
  resetUrl: "/en/login",
  logoUrl: "http://localhost/static/emails/logo.png",
  logoAlt: "Parallel",
};
