import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Maybe } from "../../util/types";
import { Email } from "../buildEmail";
import { CompleteInfoButton } from "../common/CompleteInfoButton";
import { DateTime } from "../common/DateTime";
import { Disclaimer } from "../common/Disclaimer";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { disclaimer, greetingFormal } from "../common/texts";
import { FORMATS } from "../utils/dates";

export type PetitionReminderProps = {
  emailSubject: Maybe<string>;
  contactFullName: string;
  senderName: string;
  senderEmail: string;
  missingFieldCount: number;
  bodyHtml: string | null;
  bodyPlainText: string | null;
  deadline: Date | null;
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
  subject({ emailSubject, senderName }, intl: IntlShape) {
    return (
      intl.formatMessage({
        id: "petition-reminder.reminder",
        defaultMessage: "[Reminder]",
      }) +
      ` ${
        emailSubject ||
        intl.formatMessage(
          {
            id: "petition-reminder.subject",
            defaultMessage: "Remember that {senderName} sent you a petition",
          },
          { senderName }
        )
      }`
    );
  },
  text(
    {
      contactFullName,
      senderName,
      senderEmail,
      bodyPlainText,
      missingFieldCount,
      deadline,
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
        deadline
          ? outdent`
          
          ${intl.formatMessage(
            {
              id: "generic.submit-text.with-deadline",
              defaultMessage:
                "This information has been requested to be submitted before {deadline}.",
            },
            { deadline: intl.formatDate(deadline, FORMATS.LLL) }
          )}
            `
          : ""
      }
      ${
        missingFieldCount === 0
          ? outdent`

          ${intl.formatMessage({
            id: "reminder.click-finalize",
            defaultMessage:
              "If you already submitted all the information, click <b>Finalize</b> on the page.",
          })}
          
          `
          : ""
      }
      ${intl.formatMessage({
        id: "generic.complete-information-click-link",
        defaultMessage: "Please click the link below to complete the information.",
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
    deadline,
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
        optOutUrl={`${parallelUrl}/${locale}/petition/${keycode}/opt-out`}
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
            <MjmlColumn backgroundColor="#f6f6f6" borderRadius="4px" padding="10px 0">
              <MjmlText>
                <div dangerouslySetInnerHTML={{ __html: bodyHtml }}></div>
              </MjmlText>
            </MjmlColumn>
          </MjmlSection>
        ) : null}
        <MjmlSection paddingTop="10px">
          <MjmlColumn>
            {deadline ? (
              <MjmlText>
                <FormattedMessage
                  id="generic.submit-text.with-deadline"
                  defaultMessage="This information has been requested to be submitted before {deadline}."
                  values={{
                    deadline: (
                      <span style={{ textDecoration: "underline" }}>
                        <DateTime value={deadline} format={FORMATS.LLL} />
                      </span>
                    ),
                  }}
                />
              </MjmlText>
            ) : null}
            {missingFieldCount === 0 ? (
              <MjmlText>
                <FormattedMessage
                  id="reminder.click-finalize"
                  defaultMessage="If you already submitted all the information, click <b>Finalize</b> on the page."
                  values={{
                    b: (chunks: any) => <strong>{chunks}</strong>,
                  }}
                />
              </MjmlText>
            ) : null}
            <MjmlSpacer height="10px" />
            <CompleteInfoButton href={`${parallelUrl}/${locale}/petition/${keycode}`} />
            <MjmlSpacer height="10px" />
            <Disclaimer email={senderEmail} />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
