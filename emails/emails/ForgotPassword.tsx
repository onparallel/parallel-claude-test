import { MjmlText, MjmlSection, MjmlColumn } from "mjml-react";
import React from "react";
import { FormattedMessage } from "react-intl";
import { Closing } from "../components/Closing";
import { Button } from "../components/common/Button";
import { Greeting } from "../components/Greeting";
import { Layout } from "../components/Layout";

export interface ForgotPasswordProps {
  name: string | null;
  assetsUrl: string;
  parallelUrl: string;
  resetUrl: string;
}

export default function ForgotPassword({
  name,
  assetsUrl,
  parallelUrl,
  resetUrl,
}: ForgotPasswordProps) {
  return (
    <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl}>
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
}

export const props: ForgotPasswordProps = {
  name: "Derek",
  assetsUrl: "http://localhost",
  parallelUrl: "http://localhost",
  resetUrl: "/en/login",
};
