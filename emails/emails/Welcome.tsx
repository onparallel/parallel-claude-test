import { MjmlText, MjmlSection, MjmlColumn } from "mjml-react";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Closing } from "../components/Closing";
import { Button } from "../components/common/Button";
import { Layout, LayoutProps } from "../components/Layout";

export type WelcomeProps = Omit<LayoutProps, "children"> & {
  verificationUrl: string;
};

export default function Welcome({
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
}

export const props: WelcomeProps = {
  assetsUrl: "http://localhost",
  parallelUrl: "http://localhost",
  verificationUrl: "login",
};
