import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { ClosingThanks } from "../common/ClosingThanks";
import { GreetingContact } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, gdprDisclaimer, greetingContact } from "../common/texts";

type SignatureCompletedProps = {
  documentName: string | null;
  signerName: string | null;
  signerFullName: string | null;
  signatureProvider: string;
  tone: string;
} & LayoutProps;

/** Email sent to signers to let them know the signature process has been completed. Comes with the signed document attached. */
const email: Email<SignatureCompletedProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "signature-completed.subject",
      defaultMessage: "Signature request completed",
    });
  },
  text(
    {
      signerFullName: fullName,
      signerName: name,
      signatureProvider,
      tone,
    }: SignatureCompletedProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greetingContact({ name, fullName, tone }, intl)}

      ${intl.formatMessage(
        {
          id: "signature-completed.text",
          defaultMessage:
            "Please find attached a copy of the document you just signed through {signatureProvider}.",
        },
        { signatureProvider }
      )}

      ${closing({}, intl)}

      ${gdprDisclaimer(intl)}
    `;
  },
  html({
    signerFullName: fullName,
    signerName: name,
    assetsUrl,
    parallelUrl,
    logoAlt,
    logoUrl,
    signatureProvider,
    tone,
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
        tone={tone}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingContact name={name} fullName={fullName} tone={tone} />
            <MjmlText>
              <FormattedMessage
                id="signature-completed.text"
                defaultMessage="Please find attached a copy of the document you just signed through {signatureProvider}."
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
