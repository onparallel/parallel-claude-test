import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape } from "react-intl";
import { Email } from "../buildEmail";
import { Closing } from "../common/Closing";
import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, greeting } from "../common/texts";

export type ForgotPasswordProps = {
  name: string | null;
  verificationCode: string;
} & LayoutProps;

const email: Email<ForgotPasswordProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
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
    ${greeting({ name }, intl)}

    ${intl.formatMessage({
      id: "forgot-password.verification-code-1",
      defaultMessage: "This is the verification code you requested to change your password:",
    })}

    ${verificationCode}

    ${intl.formatMessage({
      id: "forgot-password.verification-code-expiry",
      defaultMessage:
        "This verification code will expire in 30 minutes, so make sure you use as soon as possible.",
    })}

    ${closing({}, intl)}
    `;
  },
  html({ name, assetsUrl, parallelUrl, logoUrl, logoAlt, verificationCode }: ForgotPasswordProps) {
    return (
      <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl} logoUrl={logoUrl} logoAlt={logoAlt}>
        <MjmlSection padding="0 0 16px 0">
          <MjmlColumn>
            <Greeting name={name} />

            <MjmlText>
              <FormattedMessage
                id="forgot-password.verification-code-1"
                defaultMessage="This is the verification code you requested to change your password:"
              />
            </MjmlText>

            <MjmlSection padding="2px">
              <MjmlColumn width="110px" borderRadius="3px" padding="10px" backgroundColor="#F4F7F9">
                <MjmlText fontFamily="monospace" fontSize="24px" align="center" padding="0">
                  {verificationCode}
                </MjmlText>
              </MjmlColumn>
            </MjmlSection>

            <MjmlText>
              <FormattedMessage
                id="forgot-password.verification-code-expiry"
                defaultMessage="This verification code will expire in 30 minutes, so make sure you use as soon as possible."
              />
            </MjmlText>

            <Closing />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};
export default email;
