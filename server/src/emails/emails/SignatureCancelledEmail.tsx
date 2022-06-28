import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { ClosingThanks } from "../components/ClosingThanks";
import { GreetingContact } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { closing, gdprDisclaimer, greetingContact } from "../components/texts";
import { Tone } from "../utils/types";

type SignatureCancelledProps = {
  signerName: string;
  signatureProvider: string;
  tone: Tone;
} & LayoutProps;

/** Email sent to signers to let them know the signature process has been cancelled by the user. */
const email: Email<SignatureCancelledProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "signature-cancelled.subject",
      defaultMessage: "Cancelled signature request",
    });
  },
  text(
    { signerName: fullName, signatureProvider, tone }: SignatureCancelledProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greetingContact({ name: fullName, fullName, tone }, intl)}
      
      ${intl.formatMessage(
        {
          id: "signature-cancelled.text",
          defaultMessage:
            "The signing process sent through {signatureProvider} has been cancelled by the sender.",
        },
        { signatureProvider, tone }
      )}


      ${closing({}, intl)}

      ${gdprDisclaimer(intl)}
    `;
  },
  html({
    signerName: fullName,
    assetsUrl,
    parallelUrl,
    logoAlt,
    logoUrl,
    signatureProvider,
    tone,
    removeParallelBranding,
    theme,
  }: SignatureCancelledProps) {
    const intl = useIntl();
    return (
      <Layout
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        title={intl.formatMessage({
          id: "signature-cancelled.subject",
          defaultMessage: "Cancelled signature request",
        })}
        utmCampaign="recipients"
        tone={tone}
        removeParallelBranding={removeParallelBranding}
        theme={theme}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingContact name={fullName} fullName={fullName} tone={tone} />
            <MjmlText>
              <FormattedMessage
                id="signature-cancelled.text"
                defaultMessage="The signing process sent through {signatureProvider} has been cancelled by the sender."
                values={{
                  signatureProvider,
                  tone,
                }}
              />
            </MjmlText>
            <ClosingThanks tone={tone} />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
