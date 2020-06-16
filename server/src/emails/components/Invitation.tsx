import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { Closing } from "../common/Closing";
import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";

export type InvitationProps = {
  email: string;
  password: string;
} & Omit<LayoutProps, "children">;

const email: Email<InvitationProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
    });
  },
  subject({}, intl) {
    return "";
  },
  text(
    { email, password, assetsUrl, parallelUrl }: InvitationProps,
    intl: IntlShape
  ) {
    return outdent``;
  },
  html({
    email,
    password,
    assetsUrl,
    parallelUrl,
    logoUrl,
    logoAlt,
  }: InvitationProps) {
    const { locale } = useIntl();
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
      >
        <MjmlSection>
          <MjmlColumn>
            <Greeting name={null} />
            <MjmlText>
              <FormattedMessage
                id="invitation.details"
                defaultMessage="Your username is {email} and your temporary password is:"
                values={{ email: <b>{email}</b> }}
              />
            </MjmlText>
            <MjmlText>
              <b>{password}</b>
            </MjmlText>
            <MjmlText>
              <FormattedMessage
                id="invitation.website"
                defaultMessage="You can login through our website."
              />
            </MjmlText>
            <Button href={`${parallelUrl}/${locale}/login`}>
              <FormattedMessage
                id="invitation.login-button"
                defaultMessage="Log in"
              />
            </Button>
            <Closing />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

export const props: InvitationProps = {
  email: "derek@parallel.so",
  password: "Qwerty1!",
  assetsUrl: "http://localhost",
  parallelUrl: "http://localhost",
  logoUrl: "http://localhost/static/emails/logo.png",
  logoAlt: "Parallel",
};
