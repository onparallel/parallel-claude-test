import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { CompleteInfoButton } from "../common/CompleteInfoButton";
import { Disclaimer } from "../common/Disclaimer";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { disclaimer, greetingFormal } from "../common/texts";

export type PetitionReminderProps = {
  contactFullName: string;
  senderName: string;
  senderEmail: string;
  missingFieldCount: number;
  bodyHtml: string | null;
  bodyPlainText: string | null;
  keycode: string;
} & LayoutProps;

const email: Email<PetitionReminderProps> = {
  from({ senderName }, intl) {
    return intl.formatMessage(
      {
        id: "from.via-parallel",
        defaultMessage: "{senderName} (via Parallel)",
      },
      { senderName }
    );
  },
  subject({ senderName }, intl: IntlShape) {
    return intl.formatMessage(
      {
        id: "petition-reminder.subject",
        defaultMessage: "Remember that {senderName} sent you a petition",
      },
      { senderName }
    );
  },
  text(
    {
      contactFullName,
      senderName,
      senderEmail,
      bodyPlainText,
      missingFieldCount,
      keycode,
      parallelUrl,
    }: PetitionReminderProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greetingFormal({ fullName: contactFullName }, intl)}
      ${intl.formatMessage(
        {
          id: "reminder.text",
          defaultMessage:
            "We remind you that {senderName} ({senderEmail}) sent you a petition and some of the requested information has not yet been submitted.",
        },
        { senderName, senderEmail }
      )}
      
      ${bodyPlainText}
      ${
        missingFieldCount.toString() === "0"
          ? outdent`

          ${intl.formatMessage(
            {
              id: "reminder.click-finalize",
              defaultMessage:
                "If you already submitted all the information, click <b>Finalize</b> on the page.",
            },
            { b: (chunks: any[]) => chunks }
          )}
          
          `
          : ""
      }
      ${intl.formatMessage({
        id: "generic.complete-information-click-link",
        defaultMessage:
          "Please click the link below to complete the information.",
      })}
      ${parallelUrl}/${intl.locale}/petition/${keycode}

      ${disclaimer({ email: senderEmail }, intl)}
    `;
  },
  html({
    contactFullName,
    senderName,
    senderEmail,
    bodyHtml,
    keycode,
    missingFieldCount,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: PetitionReminderProps) {
    const { locale } = useIntl();
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        showGdprDisclaimer
      >
        <MjmlSection paddingBottom="10px">
          <MjmlColumn>
            <GreetingFormal fullName={contactFullName} />
            <MjmlText>
              <FormattedMessage
                id="reminder.text"
                defaultMessage="We remind you that {senderName} ({senderEmail}) sent you a petition and some of the requested information has not yet been submitted."
                values={{
                  senderName: <b>{senderName}</b>,
                  senderEmail: <b>{senderEmail}</b>,
                }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        {bodyHtml ? (
          <MjmlSection padding="0 20px">
            <MjmlColumn
              backgroundColor="#f6f6f6"
              borderRadius="4px"
              padding="10px 0"
            >
              <MjmlText>
                <div dangerouslySetInnerHTML={{ __html: bodyHtml }}></div>
              </MjmlText>
            </MjmlColumn>
          </MjmlSection>
        ) : null}
        <MjmlSection paddingTop="10px">
          <MjmlColumn>
            {missingFieldCount.toString() === "0" ? (
              <MjmlText>
                <FormattedMessage
                  id="reminder.click-finalize"
                  defaultMessage="If you already submitted all the information, click <b>Finalize</b> on the page."
                  values={{
                    b: (chunks: any[]) => <strong>{chunks}</strong>,
                  }}
                />
              </MjmlText>
            ) : null}
            <MjmlSpacer height="10px" />
            <CompleteInfoButton
              href={`${parallelUrl}/${locale}/petition/${keycode}`}
            />
            <MjmlSpacer height="10px" />
            <Disclaimer email={senderEmail} />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
