import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { greeting } from "../common/texts";

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
  text({ userName, activationUrl, parallelUrl }: AccountVerificationProps, intl: IntlShape) {
    return outdent`
      ${greeting({ name: userName }, intl)}

      ${intl.formatMessage({
        id: "account-verification.intro-text",
        defaultMessage:
          "You are almost on Parallel, to start using Parallel just click the verify email button below.",
      })}

      ${parallelUrl}/${activationUrl}

      ${intl.formatMessage({
        id: "account-verification.ignore",
        defaultMessage: "If you did not ask for this email just ignore it.",
      })}

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
        <MjmlSection paddingBottom="10px">
          <MjmlColumn>
            <Greeting name={userName} />
            <MjmlText>
              <FormattedMessage
                id="account-verification.intro-text"
                defaultMessage="You are almost on Parallel, to start using Parallel just click the verify email button below."
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection paddingTop="0px">
          <MjmlColumn>
            <Button href={`${parallelUrl}/${activationUrl}`}>
              <FormattedMessage
                id="account-verification.activate-button"
                defaultMessage="Activate my account"
              />
            </Button>
            <MjmlSpacer height="20px" />
            <MjmlText>
              <FormattedMessage
                id="account-verification.ignore"
                defaultMessage="If you did not ask for this email just ignore it."
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
