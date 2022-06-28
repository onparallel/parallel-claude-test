import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape } from "react-intl";
import { Email } from "../buildEmail";
import { ClosingParallelTeam } from "../components/ClosingParallelTeam";
import { GreetingUser } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { closing, greetingUser } from "../components/texts";

export type ForgotPasswordProps = {
  name: string | null;
  verificationCode: string;
} & LayoutProps;

const email: Email<ForgotPasswordProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject({}, intl) {
    return intl.formatMessage({
      id: "forgot-password.subject",
      defaultMessage: "Your verification code",
    });
  },
  text({ name, verificationCode }: ForgotPasswordProps, intl: IntlShape) {
    return outdent`
    ${greetingUser({ name }, intl)}

    ${intl.formatMessage({
      id: "forgot-password.verification-code-1",
      defaultMessage: "This is the verification code you requested to change your password:",
    })}

    ${verificationCode}

    ${intl.formatMessage({
      id: "forgot-password.verification-code-expiry",
      defaultMessage:
        "This verification code will expire in 30 minutes, please make sure you use it as soon as possible.",
    })}

    ${closing({}, intl)}
    `;
  },
  html({
    name,
    assetsUrl,
    parallelUrl,
    logoUrl,
    logoAlt,
    verificationCode,
    theme,
  }: ForgotPasswordProps) {
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        theme={theme}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingUser name={name} />
            <MjmlText>
              <FormattedMessage
                id="forgot-password.verification-code-1"
                defaultMessage="This is the verification code you requested to change your password:"
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <MjmlSection paddingTop="10px">
          <MjmlColumn width="110px" borderRadius="3px" padding="10px" backgroundColor="#F4F7F9">
            <MjmlText fontFamily="monospace" fontSize="24px" align="center" padding="0">
              {verificationCode}
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection padding="0">
          <MjmlColumn>
            <MjmlText>
              <FormattedMessage
                id="forgot-password.verification-code-expiry"
                defaultMessage="This verification code will expire in 30 minutes, please make sure you use it as soon as possible."
              />
            </MjmlText>

            <ClosingParallelTeam />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};
export default email;
