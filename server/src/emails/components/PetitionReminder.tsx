import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { CompleteInfoButton } from "../common/CompleteInfoButton";
import { DateTime } from "../common/DateTime";
import { Disclaimer } from "../common/Disclaimer";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import {
  PetitionFieldList,
  PetitionFieldListProps,
} from "../common/PetitionFieldList";
import { disclaimer, greetingFormal, petitionFieldList } from "../common/texts";
import { FORMATS } from "../utils/dates";

export type PetitionReminderProps = {
  contactFullName: string;
  senderName: string;
  senderEmail: string;
  fields: PetitionFieldListProps["fields"];
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
      fields,
      bodyPlainText,
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
        fields.length > 0
          ? outdent`
            ${
              deadline
                ? intl.formatMessage(
                    {
                      id: "generic.submit-text.with-deadline",
                      defaultMessage:
                        "This is the information that has been requested to be submitted before {deadline}:",
                    },
                    { deadline: intl.formatDate(deadline, FORMATS.LLL) }
                  )
                : intl.formatMessage({
                    id: "generic.submit-text.without-deadline",
                    defaultMessage:
                      "This is the information that has been requested:",
                  })
            }
            ${petitionFieldList({ fields }, intl)}`
          : intl.formatMessage(
              {
                id: "reminder.click-finalize",
                defaultMessage:
                  "If you already submitted all the information, click <b>Finalize</b> on the page.",
              },
              { b: (chunks: any[]) => chunks }
            )
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
    fields,
    bodyHtml,
    deadline,
    keycode,
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
                <span dangerouslySetInnerHTML={{ __html: bodyHtml }}></span>
              </MjmlText>
            </MjmlColumn>
          </MjmlSection>
        ) : null}
        <MjmlSection paddingTop="10px">
          <MjmlColumn>
            {fields.length > 0 ? (
              <>
                {fields.length > 10 && (
                  <CompleteInfoButton
                    href={`${parallelUrl}/${locale}/petition/${keycode}`}
                  />
                )}
                <MjmlText>
                  {deadline ? (
                    <FormattedMessage
                      id="generic.submit-text.with-deadline"
                      defaultMessage="This is the information that has been requested to be submitted before {deadline}:"
                      values={{
                        deadline: (
                          <span style={{ textDecoration: "underline" }}>
                            <DateTime value={deadline} format={FORMATS.LLL} />
                          </span>
                        ),
                      }}
                    />
                  ) : (
                    <FormattedMessage
                      id="generic.submit-text.without-deadline"
                      defaultMessage="This is the information that has been requested:"
                    />
                  )}
                </MjmlText>
                <PetitionFieldList fields={fields} />
              </>
            ) : (
              <MjmlText>
                <FormattedMessage
                  id="reminder.click-finalize"
                  defaultMessage="If you already submitted all the information, click <b>Finalize</b> on the page."
                  values={{
                    b: (chunks: any[]) => <strong>{chunks}</strong>,
                  }}
                />
              </MjmlText>
            )}
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
