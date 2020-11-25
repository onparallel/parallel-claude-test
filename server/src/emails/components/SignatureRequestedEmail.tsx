import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Closing } from "../common/Closing";

import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, greeting } from "../common/texts";

type SignatureRequestedProps = {
  signerName: string | null;
  documentName: string | null;
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
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "signature-requested.subject",
      defaultMessage: "Signature requested",
    });
  },
  text(
    { signerName: name, documentName, signButton }: SignatureRequestedProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greeting({ name }, intl)}
      ${intl.formatMessage(
        {
          id: "signature-requested.text",
          defaultMessage:
            "You have received a signature request to sign a document named {documentName}",
        },
        { documentName }
      )}

      ${intl.formatMessage({
        id: "signature-requested.external-link",
        defaultMessage: "To review and sign it, click on the following link:",
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
        title={intl.formatMessage({
          id: "signature-requested.subject",
          defaultMessage: "Signature requested",
        })}
      >
        <MjmlSection>
          <MjmlColumn>
            <Greeting name={name} />
            <MjmlText>
              <FormattedMessage
                id="signature-requested.text"
                defaultMessage="You have received a signature request to sign a document named {documentName}"
                values={{
                  documentName,
                }}
              />
            </MjmlText>

            <MjmlText>
              <FormattedMessage
                id="signature-requested.external-link"
                defaultMessage="To review and sign it, click on the following link:"
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
  parallelUrl: "http://localhost",
  assetsUrl: "https://static-staging.parallel.so",
  logoUrl: "http://localhost/static/emails/logo.png",
  logoAlt: "Parallel",
  signButton: "Open document",
};
