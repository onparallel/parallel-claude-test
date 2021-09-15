import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { ClosingFormal } from "../common/Closing Formal";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, gdprDisclaimer, greetingFormal } from "../common/texts";
import { UserMessageBox } from "../common/UserMessageBox";

type SignatureRequestedProps = {
  emailBody: string | null;
  signerName: string;
  documentName: string;
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
    { signerName: fullName, documentName, signButton, emailBody }: SignatureRequestedProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greetingFormal({ fullName }, intl)}
      ${intl.formatMessage(
        {
          id: "signature-requested.text",
          defaultMessage:
            "You have received a signature request to sign a document titled {documentName}.",
        },
        { documentName }
      )}

      ${emailBody}

      ${intl.formatMessage({
        id: "signature-requested.external-link",
        defaultMessage: "To review and sign it, click on the following link:",
      })}

      ${signButton}

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
    signButton,
    documentName,
    emailBody,
  }: SignatureRequestedProps) {
    const intl = useIntl();
    return (
      <Layout
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        title={intl.formatMessage({
          id: "signature-requested.subject",
          defaultMessage: "Signature requested",
        })}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingFormal fullName={fullName} />
            <MjmlText>
              <FormattedMessage
                id="signature-requested.text"
                defaultMessage="You have received a signature request to sign a document titled {documentName}."
                values={{ documentName }}
              />
            </MjmlText>

            <UserMessageBox dangerouslySetInnerHTML={emailBody} />

            <MjmlText>
              <FormattedMessage
                id="signature-requested.external-link"
                defaultMessage="To review and sign it, click on the following link:"
              />
            </MjmlText>
            <MjmlText align="center" fontSize="16px">
              {`${signButton}`}
            </MjmlText>
            <ClosingFormal />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
