import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { Closing } from "../common/Closing";
import { Layout, LayoutProps } from "../common/Layout";
import { closing } from "../common/texts";

export type WelcomeProps = {
  verificationUrl: string;
} & LayoutProps;

const email: Email<WelcomeProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
    });
  },
  subject({}, intl) {
    return "";
  },
  text({ verificationUrl, parallelUrl }, intl) {
    return outdent`
      ${intl.formatMessage({
        id: "welcome.greeting",
        defaultMessage: "Welcome to Parallel!",
      })}
      ${intl.formatMessage({
        id: "welcome.click-to-verify",
        defaultMessage:
          "Please click the link below to verify your email address.",
      })}
      ${parallelUrl}/${intl.locale}/${verificationUrl}
      
      ${closing({}, intl)}
    `;
  },
  html({ verificationUrl, parallelUrl, assetsUrl, logoUrl, logoAlt }) {
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
            <MjmlText fontSize="16px">
              <FormattedMessage
                id="welcome.greeting"
                defaultMessage="Welcome to Parallel!"
              />
            </MjmlText>
            <MjmlText>
              <FormattedMessage
                id="welcome.click-to-verify"
                defaultMessage="Please click the link below to verify your email address."
              />
            </MjmlText>
            <Button href={`${parallelUrl}/${locale}/${verificationUrl}`}>
              <FormattedMessage
                id="welcome.verify-button"
                defaultMessage="Verify my email"
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

export const props: WelcomeProps = {
  assetsUrl: "http://localhost",
  parallelUrl: "http://localhost",
  verificationUrl: "login",
  logoUrl: "http://localhost/static/emails/logo.png",
  logoAlt: "Parallel",
};
