import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { Closing } from "../common/Closing";
import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { greeting } from "../common/texts";

export type InvitationProps = {
  email: string;
  password: string;
  organizationUser: string;
  organizationName: string;
  userName: string;
} & LayoutProps;

const email: Email<InvitationProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
    });
  },
  subject({ organizationUser }, intl) {
    return intl.formatMessage(
      {
        id: "invitation.subject",
        defaultMessage: "{organizationUser} has invited you to join Parallel",
      },
      { organizationUser }
    );
  },
  text(
    { userName, organizationName, organizationUser, parallelUrl, email, password }: InvitationProps,
    intl: IntlShape
  ) {
    return outdent`
    ${greeting({ name: userName }, intl)}
    
    ${intl.formatMessage(
      {
        id: "invitation.text",
        defaultMessage:
          "{organizationUser} has invited you to join {organizationName} organization in Parallel.",
      },
      { organizationName, organizationUser }
    )}

    ${intl.formatMessage(
      {
        id: "invitation.details",
        defaultMessage: "Your username is {email} and your temporary password is:",
      },
      { email }
    )}

    ${password}

    ${intl.formatMessage({
      id: "invitation.tmp-password-expiry",
      defaultMessage: "This password will expire in 30 days, try to use it as soon as possible.",
    })}

    ${intl.formatMessage({
      id: "invitation.website",
      defaultMessage: "You can login through our website.",
    })}

    ${parallelUrl}/${intl.locale}/login
    `;
  },
  html({
    email,
    password,
    assetsUrl,
    parallelUrl,
    logoUrl,
    logoAlt,
    userName,
    organizationName,
    organizationUser,
  }: InvitationProps) {
    const { locale } = useIntl();
    return (
      <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl} logoUrl={logoUrl} logoAlt={logoAlt}>
        <MjmlSection padding="0 0 16px 0">
          <MjmlColumn>
            <Greeting name={userName} />
            <MjmlText>
              <FormattedMessage
                id="invitation.text"
                defaultMessage="{organizationUser} has invited you to join {organizationName} organization in Parallel."
                values={{ organizationUser, organizationName }}
              />
            </MjmlText>
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
                id="invitation.tmp-password-expiry"
                defaultMessage="This password will expire in 30 days, try to use it as soon as possible."
              />
            </MjmlText>
            <Button href={`${parallelUrl}/${locale}/login`} fontWeight={500}>
              <FormattedMessage id="invitation.login-button" defaultMessage="Log in" />
            </Button>
            <Closing />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
