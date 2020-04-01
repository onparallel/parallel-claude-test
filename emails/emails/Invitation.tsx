import { MjmlButton, MjmlText, MjmlSection, MjmlColumn } from "mjml-react";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Greeting } from "../components/Greeting";
import { Layout } from "../components/Layout";
import { Button } from "../components/common/Button";
import { Closing } from "../components/Closing";

export interface InvitationProps {
  email: string;
  password: string;
  assetsUrl: string;
  parallelUrl: string;
}

export default function Invitation({
  email,
  password,
  assetsUrl,
  parallelUrl,
}: InvitationProps) {
  const { locale } = useIntl();
  return (
    <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl}>
      <MjmlSection>
        <MjmlColumn>
          <Greeting name={null} />
          <MjmlText>
            <FormattedMessage
              id="invitation.details"
              defaultMessage={`Your username is {email} and your temporary password is:`}
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
}

export const props: InvitationProps = {
  email: "derek@parallel.so",
  password: "Qwerty1!",
  assetsUrl: "http://localhost",
  parallelUrl: "http://localhost",
};
