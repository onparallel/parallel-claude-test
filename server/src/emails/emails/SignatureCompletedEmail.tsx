import { MjmlColumn, MjmlSection, MjmlText } from "@faire/mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { ClosingThanks } from "../components/ClosingThanks";
import { GreetingContact } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { closing, gdprDisclaimer, greetingContact } from "../components/texts";

type SignatureCompletedProps = {
  documentName: string | null;
  signerName: string;
  signatureProvider: string;
} & LayoutProps;

/** Email sent to signers to let them know the signature process has been completed. Comes with the signed document attached. */
const email: Email<SignatureCompletedProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "signature-completed.subject",
      defaultMessage: "Signature request completed",
    });
  },
  text(
    { signerName: fullName, signatureProvider, theme }: SignatureCompletedProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greetingContact({ name: fullName, fullName, tone: theme.preferredTone }, intl)}

      ${intl.formatMessage(
        {
          id: "signature-completed.text",
          defaultMessage:
            "Please find attached a copy of the document you just signed through {signatureProvider}.",
        },
        { signatureProvider, tone: theme.preferredTone }
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

    removeParallelBranding,
    theme,
  }: SignatureCompletedProps) {
    const intl = useIntl();
    return (
      <Layout
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        title={intl.formatMessage({
          id: "signature-completed.subject",
          defaultMessage: "Signature request completed",
        })}
        utmCampaign="recipients"
        removeParallelBranding={removeParallelBranding}
        theme={theme}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingContact name={fullName} fullName={fullName} tone={theme.preferredTone} />
            <MjmlText>
              <FormattedMessage
                id="signature-completed.text"
                defaultMessage="Please find attached a copy of the document you just signed through {signatureProvider}."
                values={{
                  signatureProvider,
                  tone: theme.preferredTone,
                }}
              />
            </MjmlText>
            <ClosingThanks tone={theme.preferredTone} />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
