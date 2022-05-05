import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { ClosingThanks } from "../components/ClosingThanks";
import { GreetingContact } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { closing, gdprDisclaimer, greetingContact } from "../components/texts";
import { UserMessageBox } from "../components/UserMessageBox";
import { Tone } from "../utils/types";

type SignatureRequestedProps = {
  emailBody: string | null;
  signerName: string;
  documentName: string;
  signButton: string;
  tone: Tone;
} & LayoutProps;

/** Email sent to signers with access to the signing URL. */
const email: Email<SignatureRequestedProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "signature-requested.subject",
      defaultMessage: "Signature requested",
    });
  },
  text(
    { signerName: fullName, documentName, signButton, emailBody, tone }: SignatureRequestedProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greetingContact({ name: fullName, fullName, tone }, intl)}

      ${intl.formatMessage(
        {
          id: "signature-requested.text",
          defaultMessage:
            "You have received a signature request to sign a document titled {documentName}.",
        },
        { documentName, tone }
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
    tone,
    removeParallelBranding,
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
        utmCampaign="recipients"
        tone={tone}
        removeParallelBranding={removeParallelBranding}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingContact name={fullName} fullName={fullName} tone={tone} />
            <MjmlText>
              <FormattedMessage
                id="signature-requested.text"
                defaultMessage="You have received a signature request to sign a document titled {documentName}."
                values={{ documentName, tone }}
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
            <ClosingThanks tone={tone} />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
