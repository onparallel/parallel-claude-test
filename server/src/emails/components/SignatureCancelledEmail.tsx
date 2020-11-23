import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Closing } from "../common/Closing";

import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, greeting } from "../common/texts";

export type SignatureCompletedProps = {
  documentName: string | null;
  signerName: string | null;
  signatureProvider: string;
} & LayoutProps;

/** Email sent to signers to let them know the signature process has been cancelled by the user. */
const email: Email<SignatureCompletedProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "signature-cancelled.subject",
      defaultMessage: "Cancelled signature request on Petition",
    });
  },
  text(
    { signerName, signatureProvider, documentName }: SignatureCompletedProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greeting({ name: signerName }, intl)}
      ${intl.formatMessage(
        {
          id: "signature-cancelled.text",
          defaultMessage:
            "The signing process sent through {signatureProvider} has been cancelled by the sender.",
        },
        { signatureProvider }
      )}


      ${closing({}, intl)}
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
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        title={intl.formatMessage({
          id: "signature-cancelled.subject",
          defaultMessage: "Cancelled signature request on Petition",
        })}
      >
        <MjmlSection>
          <MjmlColumn>
            <Greeting name={signerName} />
            <MjmlText>
              <FormattedMessage
                id="signature-cancelled.text"
                defaultMessage="The signing process sent through {signatureProvider} has been cancelled by the sender."
                values={{
                  signatureProvider,
                }}
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

export const props: SignatureCompletedProps = {
  signatureProvider: "Signaturit",
  documentName: "Know Your Client (KYC)",
  signerName: "Mariano",
  parallelUrl: "http://localhost",
  assetsUrl: "https://static-staging.parallel.so",
  logoUrl: "http://localhost/static/emails/logo.png",
  logoAlt: "Parallel",
};
