import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import React from "react";
import { FormattedMessage, useIntl, IntlShape } from "react-intl";
import { Button } from "../common/Button";
import { Closing } from "../common/Closing";
import { Greeting } from "../common/Greeting";
import { Layout } from "../common/Layout";
import outdent from "outdent";

export interface InvitationProps {
  email: string;
  password: string;
  assetsUrl: string;
  parallelUrl: string;
}

export default {
  text: function Invitation(
    { email, password, assetsUrl, parallelUrl }: InvitationProps,
    intl: IntlShape
  ) {
    return outdent``;
  },
  html: function Invitation({
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

export const props: InvitationProps = {
  email: "derek@parallel.so",
  password: "Qwerty1!",
  assetsUrl: "http://localhost",
  parallelUrl: "http://localhost",
};
