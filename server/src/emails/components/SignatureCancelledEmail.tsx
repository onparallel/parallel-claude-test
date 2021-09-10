import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { ClosingFormal } from "../common/Closing Formal";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, gdprDisclaimer, greetingFormal } from "../common/texts";

type SignatureCancelledProps = {
  signerName: string | null;
  signatureProvider: string;
} & LayoutProps;

/** Email sent to signers to let them know the signature process has been cancelled by the user. */
const email: Email<SignatureCancelledProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "signature-cancelled.subject",
      defaultMessage: "Cancelled signature request",
    });
  },
  text({ signerName, signatureProvider }: SignatureCancelledProps, intl: IntlShape) {
    return outdent`
      ${greetingFormal({ fullName: signerName }, intl)}
      ${intl.formatMessage(
        {
          id: "signature-cancelled.text",
          defaultMessage:
            "The signing process sent through {signatureProvider} has been cancelled by the sender.",
        },
        { signatureProvider }
      )}


      ${closing({}, intl)}

      ${gdprDisclaimer(intl)}
    `;
  },
  html({
    signerName,
    assetsUrl,
    parallelUrl,
    logoAlt,
    logoUrl,
    signatureProvider,
  }: SignatureCancelledProps) {
    const intl = useIntl();
    return (
      <Layout
        showGdprDisclaimer
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        title={intl.formatMessage({
          id: "signature-cancelled.subject",
          defaultMessage: "Cancelled signature request",
        })}
      >
        <MjmlSection padding="0 0 16px 0">
          <MjmlColumn>
            <GreetingFormal fullName={signerName} />
            <MjmlText>
              <FormattedMessage
                id="signature-cancelled.text"
                defaultMessage="The signing process sent through {signatureProvider} has been cancelled by the sender."
                values={{
                  signatureProvider,
                }}
              />
            </MjmlText>
            <ClosingFormal />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
