import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { GreetingNewUser } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { greetingUser } from "../common/texts";
import { WhatsParallel } from "../common/WhatsParallel";

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
  subject({ organizationUser, organizationName }, intl) {
    return intl.formatMessage(
      {
        id: "invitation.subject",
        defaultMessage:
          "{organizationUser} invited you to join {organizationName} organization in Parallel 🎊",
      },
      { organizationUser, organizationName }
    );
  },
  text(
    { userName, organizationName, organizationUser, parallelUrl, email, password }: InvitationProps,
    intl: IntlShape
  ) {
    return outdent`
    ${greetingUser({ name: userName }, intl)}
    
    ${intl.formatMessage(
      {
        id: "invitation.text",
        defaultMessage:
          "{organizationUser} has invited you to join {organizationName} organization in Parallel.",
      },
      { organizationName, organizationUser }
    )}

    ${intl.formatMessage({
      id: "invitation.details",
      defaultMessage: "To get started, log in with your username and temporary password:",
    })}

    ${intl.formatMessage(
      {
        id: "invitation.username",
        defaultMessage: "Username: {email}",
      },
      { email }
    )}
    ${intl.formatMessage(
      {
        id: "invitation.password",
        defaultMessage: "Password: {password}",
      },
      { password }
    )}

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
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingNewUser name={userName} />
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
                defaultMessage="To get started, log in with your username and temporary password:"
              />
            </MjmlText>
            <MjmlSection backgroundColor="#F4F7F9" borderRadius="5px" padding="12px 16px">
              <MjmlText>
                <FormattedMessage
                  id="invitation.username"
                  defaultMessage="Username: {email}"
                  values={{ email: <b>{email}</b> }}
                />
              </MjmlText>
              <MjmlSpacer height="10px" />
              <MjmlText>
                <FormattedMessage
                  id="invitation.password"
                  defaultMessage="Password: {password}"
                  values={{ password: <b>{password}</b> }}
                />
              </MjmlText>
            </MjmlSection>
            <MjmlText>
              <FormattedMessage
                id="invitation.waiting-to-collaborate"
                defaultMessage="{organizationUser} is waiting for you to collaborate together! 😁"
                values={{ organizationUser }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection>
          <MjmlColumn>
            <Button href={`${parallelUrl}/${locale}/login`} fontWeight={500}>
              <FormattedMessage id="invitation.join-parallel" defaultMessage="Join Parallel" />
            </Button>
          </MjmlColumn>
          <WhatsParallel />
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
