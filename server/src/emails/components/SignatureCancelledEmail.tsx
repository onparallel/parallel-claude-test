import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage, IntlShape } from "react-intl";
import { Email } from "../buildEmail";
import { Closing } from "../common/Closing";

import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, greeting } from "../common/texts";

export type SignatureCompletedProps = {
  documentName: string | null;
  signerName: string | null;
  senderEmail: string | null;
  senderName: string;
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
  subject({ documentName }: SignatureCompletedProps, intl: IntlShape) {
    return intl.formatMessage(
      {
        id: "signature-cancelled.subject",
        defaultMessage:
          'Cancelled signature request containing "{documentName}"',
      },
      { documentName }
    );
  },
  text(
    {
      senderName,
      senderEmail,
      signerName,
      signatureProvider,
      documentName,
    }: SignatureCompletedProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greeting({ name: signerName }, intl)}
      ${intl.formatMessage(
        {
          id: "signature-cancelled.text",
          defaultMessage:
            "This is to let you know that {senderName} ({senderEmail}) has cancelled the signing process sent through {signatureProvider}.",
        },
        { senderName, senderEmail, signatureProvider }
      )}

      ${intl.formatMessage(
        {
          id: "signature-cancelled.text-2",
          defaultMessage: "Document cancelled: {documentName}.",
        },
        { documentName }
      )}

      ${closing({}, intl)}
    `;
  },
  html({
    signerName,
    senderEmail,
    senderName,
    assetsUrl,
    parallelUrl,
    logoAlt,
    logoUrl,
    signatureProvider,
    documentName,
  }: SignatureCompletedProps) {
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
      >
        <MjmlSection>
          <MjmlColumn>
            <Greeting name={signerName} />
            <MjmlText>
              <FormattedMessage
                id="signature-cancelled.text"
                defaultMessage="This is to let you know that {senderName} ({senderEmail}) has cancelled the signing process sent through {signatureProvider}."
                values={{
                  senderName: <b>{senderName}</b>,
                  senderEmail: <b>{senderEmail}</b>,
                  signatureProvider,
                }}
              />
            </MjmlText>

            <MjmlText>
              <FormattedMessage
                id="signature-cancelled.text-2"
                defaultMessage="Document cancelled: {documentName}."
                values={{
                  documentName,
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
  senderName: "Mariano",
  senderEmail: "mariano@parallel.so",
  signerName: "Mariano",
  parallelUrl: "http://localhost",
  assetsUrl: "https://static-staging.parallel.so",
  logoUrl: "http://localhost/static/emails/logo.png",
  logoAlt: "Parallel",
};
