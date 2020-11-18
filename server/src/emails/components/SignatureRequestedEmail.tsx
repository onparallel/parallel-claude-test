import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Closing } from "../common/Closing";

import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, greeting } from "../common/texts";

export type SignatureRequestedProps = {
  signerName: string | null;
  documentName: string | null;
  senderName: string;
  senderEmail: string;
  signButton: string;
} & LayoutProps;

/** Email sent to signers with access to the signing URL. */
const email: Email<SignatureRequestedProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
    });
  },
  subject({ documentName }: SignatureRequestedProps, intl: IntlShape) {
    return intl.formatMessage(
      {
        id: "signature-requested.subject",
        defaultMessage: 'Signature request containing "{documentName}"',
      },
      { documentName }
    );
  },
  text(
    {
      signerName: name,
      senderEmail,
      senderName,
      signButton,
    }: SignatureRequestedProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greeting({ name }, intl)}
      ${intl.formatMessage(
        {
          id: "signature-requested.text",
          defaultMessage:
            "{senderName} ({senderEmail}) has sent you a document requiring your signature.",
        },
        { senderName, senderEmail }
      )}

      ${intl.formatMessage({
        id: "signature-requested.external-link",
        defaultMessage:
          "To review and sign the document, click on the following link:",
      })}

      ${signButton}

      ${closing({}, intl)}
    `;
  },
  html({
    signerName: name,
    assetsUrl,
    parallelUrl,
    logoAlt,
    logoUrl,
    senderEmail,
    senderName,
    signButton,
    documentName,
  }: SignatureRequestedProps) {
    const intl = useIntl();
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        title={intl.formatMessage(
          {
            id: "signature-requested.subject",
            defaultMessage: 'Signature request containing "{documentName}"',
          },
          { documentName }
        )}
      >
        <MjmlSection>
          <MjmlColumn>
            <Greeting name={name} />
            <MjmlText>
              <FormattedMessage
                id="signature-requested.text"
                defaultMessage="{senderName} ({senderEmail}) has sent you a document requiring your signature."
                values={{
                  senderName: <b>{senderName}</b>,
                  senderEmail: <b>{senderEmail}</b>,
                }}
              />
            </MjmlText>

            <MjmlText>
              <FormattedMessage
                id="signature-requested.external-link"
                defaultMessage="To review and sign the document, click on the following link:"
              />
            </MjmlText>

            <MjmlText align="center" fontSize="16px">
              {`${signButton}`}
            </MjmlText>

            <Closing />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

export const props: SignatureRequestedProps = {
  signerName: "Derek",
  documentName: "Know your Client (KYC)",
  senderName: "Mariano",
  senderEmail: "mariano@parallel.so",
  parallelUrl: "http://localhost",
  assetsUrl: "https://static-staging.parallel.so",
  logoUrl: "http://localhost/static/emails/logo.png",
  logoAlt: "Parallel",
  signButton: "Open document",
};
