import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Maybe } from "../../util/types";
import { Email } from "../buildEmail";
import { CompleteInfoButton } from "../common/CompleteInfoButton";
import { DateTime } from "../common/DateTime";
import { Disclaimer } from "../common/Disclaimer";
import { GreetingReminder } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { disclaimer, greetingContact } from "../common/texts";
import { UserMessageBox } from "../common/UserMessageBox";
import { FORMATS } from "../utils/dates";
import { Tone } from "../utils/types";

export type PetitionReminderProps = {
  emailSubject: Maybe<string>;
  contactFullName: string;
  contactName: string;
  senderName: string;
  senderEmail: string;
  missingFieldCount: number;
  totalFieldCount: number;
  bodyHtml: string | null;
  bodyPlainText: string | null;
  deadline: Date | null;
  keycode: string;
  tone: Tone;
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
      contactFullName: fullName,
      contactName: name,
      senderName,
      senderEmail,
      bodyPlainText,
      missingFieldCount,
      totalFieldCount,
      deadline,
      keycode,
      parallelUrl,
      tone,
    }: PetitionReminderProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greetingContact({ name, fullName, tone }, intl)}
      
      ${intl.formatMessage(
        {
          id: "reminder.text",
          defaultMessage:
            "We remind you that {senderName} ({senderEmail}) sent you a petition and some of the requested information has not yet been submitted.",
        },
        { senderName, senderEmail, tone }
      )}
      
      ${bodyPlainText}

      ${intl.formatMessage(
        {
          id: "reminder.pending-fields-count",
          defaultMessage: "You have {pending}/{total} fields pending.",
        },
        { pending: missingFieldCount, total: totalFieldCount, tone }
      )}
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

      ${intl.formatMessage({
        id: "layout.stop-reminders",
        defaultMessage: "Stop receiving reminders",
      })}:
      ${parallelUrl}/${intl.locale}/petition/${keycode}/opt-out?ref=reminder
    `;
  },
  html({
    contactFullName: fullName,
    contactName: name,
    senderName,
    senderEmail,
    bodyHtml,
    deadline,
    keycode,
    missingFieldCount,
    totalFieldCount,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
    tone,
  }: PetitionReminderProps) {
    const intl = useIntl();

    return (
      <Layout
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        optOutUrl={`${parallelUrl}/${intl.locale}/petition/${keycode}/opt-out?ref=reminder`}
        optOutText={intl.formatMessage({
          id: "layout.stop-reminders",
          defaultMessage: "Stop receiving reminders",
        })}
        tone={tone}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingReminder name={name} fullName={fullName} tone={tone} />

            <MjmlText lineHeight="24px">
              <FormattedMessage
                id="reminder.text"
                defaultMessage="We remind you that {senderName} ({senderEmail}) sent you a petition and some of the requested information has not yet been submitted."
                values={{
                  senderName: <b>{senderName}</b>,
                  senderEmail: <b>{senderEmail}</b>,
                  tone,
                }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <UserMessageBox dangerouslySetInnerHTML={bodyHtml} />

        <MjmlSection paddingTop="0">
          <MjmlColumn>
            <MjmlText>
              <li>
                <FormattedMessage
                  id="reminder.pending-fields-count"
                  defaultMessage="You have {pending}/{total} fields pending."
                  values={{ pending: missingFieldCount, total: totalFieldCount, tone }}
                />
              </li>
            </MjmlText>
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
                />
              </MjmlText>
            ) : null}
            <MjmlSpacer height="10px" />
            <CompleteInfoButton
              tone={tone}
              href={`${parallelUrl}/${intl.locale}/petition/${keycode}`}
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
