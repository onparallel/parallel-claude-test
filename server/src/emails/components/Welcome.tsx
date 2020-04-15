import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Button } from "../common/Button";
import { Closing } from "../common/Closing";
import { Layout } from "../common/Layout";
import { closing } from "../common/texts";

export type WelcomeProps = {
  verificationUrl: string;
  parallelUrl: string;
  assetsUrl: string;
};

export default {
  text: function Welcome(
    { verificationUrl, parallelUrl }: WelcomeProps,
    intl: IntlShape
  ) {
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
  html: function Welcome({
    verificationUrl,
    parallelUrl,
    assetsUrl,
  }: WelcomeProps) {
    const { locale } = useIntl();
    return (
      <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl}>
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

export const props: WelcomeProps = {
  assetsUrl: "http://localhost",
  parallelUrl: "http://localhost",
  verificationUrl: "login",
};
