import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { GreetingUser } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { greetingUser } from "../common/texts";

export type AccountVerificationProps = {
  userName: string | null;
  activationUrl: string | null;
} & LayoutProps;

const email: Email<AccountVerificationProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
    });
  },
  subject({}, intl: IntlShape) {
    return intl.formatMessage({
      id: "account-verification.subject",
      defaultMessage: "Activate your Parallel account",
    });
  },
  text({ userName, activationUrl }: AccountVerificationProps, intl: IntlShape) {
    return outdent`
      ${greetingUser({ name: userName }, intl)}

      ${intl.formatMessage({
        id: "account-verification.intro-text.plain",
        defaultMessage:
          "You are almost ready, to start using Parallel just click on the link below.",
      })}

      ${activationUrl}
    `;
  },
  html({
    userName,
    activationUrl,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: AccountVerificationProps) {
    return (
      <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl} logoUrl={logoUrl} logoAlt={logoAlt}>
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingUser name={userName} />
            <MjmlText>
              <FormattedMessage
                id="account-verification.intro-text.html"
                defaultMessage="You are almost ready, to start using Parallel just click on the activate account button below."
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection>
          <MjmlColumn>
            <Button href={`${activationUrl}`}>
              <FormattedMessage
                id="account-verification.activate-button"
                defaultMessage="Activate my account"
              />
            </Button>
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
