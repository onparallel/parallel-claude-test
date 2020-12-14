import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, gdprDisclaimer, greetingFormal } from "../common/texts";

type SignatureCompletedProps = {
  documentName: string | null;
  signerName: string | null;
  signatureProvider: string;
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
    { signerName, signatureProvider }: SignatureCompletedProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greetingFormal({ fullName: signerName }, intl)}
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
    signerName,
    assetsUrl,
    parallelUrl,
    logoAlt,
    logoUrl,
    signatureProvider,
  }: SignatureCompletedProps) {
    const intl = useIntl();
    return (
      <Layout
        showGdprDisclaimer
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        title={intl.formatMessage({
          id: "signature-completed.subject",
          defaultMessage: "Signature request completed",
        })}
      >
        <MjmlSection>
          <MjmlColumn>
            <GreetingFormal fullName={signerName} />
            <MjmlText>
              <FormattedMessage
                id="signature-completed.text"
                defaultMessage="Please find attached a copy of the document you just signed through {signatureProvider}."
                values={{
                  signatureProvider,
                }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

export const props: SignatureCompletedProps = {
  signatureProvider: "Signaturit",
  documentName: "Know Your Client (KYC)",
  signerName: "Mariano",
  parallelUrl: "http://localhost",
  assetsUrl: "https://static-staging.parallel.so",
  logoUrl: "http://localhost/static/emails/logo.png",
  logoAlt: "Parallel",
};
