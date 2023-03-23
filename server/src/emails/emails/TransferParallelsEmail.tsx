import { MjmlColumn, MjmlSection, MjmlText } from "@faire/mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { GreetingUser } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { greetingUser } from "../components/texts";

export type TransferParallelsEmailProps = {
  name: string | null;
  userEmail: string;
  userFullName: string;
} & LayoutProps;

const email: Email<TransferParallelsEmailProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "transfer-parallels-email.subject",
      defaultMessage: "You have parallels pending transfer",
    });
  },
  text(
    { name, userEmail, userFullName, parallelUrl }: TransferParallelsEmailProps,
    intl: IntlShape
  ) {
    const params = new URLSearchParams({ search: userEmail, transfer: "" }).toString();
    return outdent`
      **${intl
        .formatMessage({
          id: "generic.action-required",
          defaultMessage: "Action required",
        })
        .toUpperCase()}**

      ${greetingUser({ name }, intl)}

      ${intl.formatMessage(
        {
          id: "transfer-parallels-email.intro-text",
          defaultMessage:
            "The account of the user {user} has been disabled. In order not to lose access to your parallels, we need you to transfer them to another user in the organization.",
        },
        {
          user: `${userFullName} (${userEmail})`,
        }
      )}

      ${intl.formatMessage({
        id: "transfer-parallels-email.access-click-link",
        defaultMessage: "Follow the link below to transfer the parallels.",
      })}
      ${parallelUrl}/${intl.locale}/app/organization/users?${params}
    `;
  },
  html({
    name,
    userEmail,
    userFullName,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
    theme,
  }: TransferParallelsEmailProps) {
    const intl = useIntl();

    const params = new URLSearchParams({ search: userEmail, transfer: "" }).toString();
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        contentHeading={
          <Alert>
            <FormattedMessage id="generic.action-required" defaultMessage="Action required" />
          </Alert>
        }
        theme={theme}
      >
        <MjmlSection padding="10px 0 0 0">
          <MjmlColumn>
            <GreetingUser name={name} />
            <MjmlText>
              <FormattedMessage
                id="transfer-parallels-email.intro-text"
                defaultMessage="The account of the user {user} has been disabled. In order not to lose access to your parallels, we need you to transfer them to another user in the organization."
                values={{
                  user: (
                    <b>
                      {userFullName} ({userEmail})
                    </b>
                  ),
                }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection>
          <MjmlColumn>
            <Button href={`${parallelUrl}/${intl.locale}/app/organization/users?${params}`}>
              <FormattedMessage
                id="transfer-parallels-email.transfer-parallels-button"
                defaultMessage="Transfer parallels"
              />
            </Button>
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
