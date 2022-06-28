import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { ClosingThanks } from "../components/ClosingThanks";
import { GreetingReminder } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import { closing, gdprDisclaimer, greetingReminder } from "../components/texts";
import { Tone } from "../utils/types";

type SignatureReminderProps = {
  signerName: string;
  documentName: string;
  signButton: string;
  tone: Tone;
} & LayoutProps;

/** Email sent to signers with access to the signing URL. */
const email: Email<SignatureReminderProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "signature-reminder.subject",
      defaultMessage: "Signature reminder",
    });
  },
  text(
    { signerName: fullName, documentName, signButton, tone }: SignatureReminderProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greetingReminder({ fullName, name: fullName, tone }, intl)}

      ${intl.formatMessage(
        {
          id: "signature-reminder.text",
          defaultMessage:
            "You have a pending signature request to sign a document titled {documentName}.",
        },
        { documentName, tone }
      )}

      ${intl.formatMessage({
        id: "signature-reminder.external-link",
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
    tone,
    removeParallelBranding,
    theme,
  }: SignatureReminderProps) {
    const intl = useIntl();
    return (
      <Layout
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        title={intl.formatMessage({
          id: "signature-reminder.subject",
          defaultMessage: "Signature reminder",
        })}
        utmCampaign="recipients"
        tone={tone}
        removeParallelBranding={removeParallelBranding}
        theme={theme}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingReminder name={fullName} fullName={fullName} tone={tone} />
            <MjmlText>
              <FormattedMessage
                id="signature-reminder.text"
                defaultMessage="You have a pending signature request to sign a document titled {documentName}."
                values={{ documentName, tone }}
              />
            </MjmlText>

            <MjmlText>
              <FormattedMessage
                id="signature-reminder.external-link"
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
