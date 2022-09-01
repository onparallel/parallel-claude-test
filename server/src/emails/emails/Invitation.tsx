import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../components/Button";
import { GreetingNewUser } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { greetingUser } from "../components/texts";
import { WhatsParallel } from "../components/WhatsParallel";

export type InvitationProps = {
  email?: string;
  password?: string;
  organizationUser: string;
  organizationName: string;
  userName: string;
  isNewUser: boolean;
} & LayoutProps;

const email: Email<InvitationProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject({ organizationUser, organizationName }, intl) {
    return organizationUser.length
      ? intl.formatMessage(
          {
            id: "invitation.subject",
            defaultMessage:
              "{organizationUser} invited you to join {organizationName} on Parallel 🎊",
          },
          { organizationUser, organizationName }
        )
      : intl.formatMessage(
          {
            id: "invitation.subject-anonymous",
            defaultMessage: "You have been invited to join {organizationName} on Parallel 🎊",
          },
          { organizationName }
        );
  },
  text(
    {
      userName,
      organizationName,
      organizationUser,
      parallelUrl,
      email,
      password,
      isNewUser,
    }: InvitationProps,
    intl: IntlShape
  ) {
    return outdent`
    ${greetingUser({ name: userName }, intl)}
    
    ${
      organizationName.length
        ? intl.formatMessage(
            {
              id: "invitation.text",
              defaultMessage:
                "{organizationUser} has invited you to join {organizationName} on Parallel.",
            },
            { organizationName, organizationUser }
          )
        : intl.formatMessage(
            {
              id: "invitation.text-anonymous",
              defaultMessage: "You have been invited to join {organizationName} on Parallel.",
            },
            { organizationName }
          )
    }
    ${
      isNewUser
        ? `${intl.formatMessage({
            id: "invitation.details.new-user",
            defaultMessage: "Get started by logging in with your email and temporary password:",
          })}

  ${intl.formatMessage(
    {
      id: "invitation.email",
      defaultMessage: "Email: {email}",
    },
    { email }
  )}
  ${intl.formatMessage(
    {
      id: "invitation.password",
      defaultMessage: "Password: {password}",
    },
    { password }
  )}`
        : `${intl.formatMessage({
            id: "invitation.details.registered-user",
            defaultMessage:
              "Log in with your email and password and then choose which organization you want to work on.",
          })}`
    }

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
    theme,
    isNewUser,
  }: InvitationProps) {
    const { locale } = useIntl();
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        omitGdprDisclaimer
        theme={theme}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingNewUser name={userName} />
            <MjmlText>
              {organizationUser.length ? (
                <FormattedMessage
                  id="invitation.text"
                  defaultMessage="{organizationUser} has invited you to join {organizationName} on Parallel."
                  values={{ organizationUser, organizationName }}
                />
              ) : (
                <FormattedMessage
                  id="invitation.text-anonymous"
                  defaultMessage="You have been invited to join {organizationName} on Parallel."
                  values={{ organizationName }}
                />
              )}
            </MjmlText>
            {isNewUser ? (
              <>
                <MjmlText>
                  <FormattedMessage
                    id="invitation.details.new-user"
                    defaultMessage="Get started by logging in with your email and temporary password:"
                  />
                </MjmlText>
                <MjmlSection backgroundColor="#F4F7F9" borderRadius="5px" padding="12px 16px">
                  <MjmlText>
                    <FormattedMessage
                      id="invitation.email"
                      defaultMessage="Email: {email}"
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
              </>
            ) : (
              <MjmlText>
                <FormattedMessage
                  id="invitation.details.registered-user"
                  defaultMessage="Log in with your email and password and then choose which organization you want to work on."
                />
              </MjmlText>
            )}
            {organizationUser.length ? (
              <MjmlText>
                <FormattedMessage
                  id="invitation.waiting-to-collaborate"
                  defaultMessage="{organizationUser} is waiting for you to collaborate together! 😁"
                  values={{ organizationUser }}
                />
              </MjmlText>
            ) : null}
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection>
          <MjmlColumn>
            <Button href={`${parallelUrl}/${locale}/login`} fontWeight={500}>
              {isNewUser ? (
                <FormattedMessage id="invitation.join-parallel" defaultMessage="Join Parallel" />
              ) : (
                <FormattedMessage id="invitation.access-parallel" defaultMessage="Log in" />
              )}
            </Button>
          </MjmlColumn>
        </MjmlSection>
        <WhatsParallel />
      </Layout>
    );
  },
};

export default email;
