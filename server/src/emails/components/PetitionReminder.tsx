import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
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
import { RenderSlate } from "../common/RenderSlate";
import {
  disclaimer,
  greetingFormal,
  petitionFieldList,
  renderSlateText,
} from "../common/texts";
import { FORMATS } from "../utils/dates";

export type PetitionReminderProps = {
  fullName: string | null;
  senderName: string;
  senderEmail: string;
  fields: PetitionFieldListProps["fields"];
  body: any | null;
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
      fullName,
      senderName,
      senderEmail,
      fields,
      body,
      deadline,
      keycode,
      parallelUrl,
    }: PetitionReminderProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greetingFormal({ fullName }, intl)}
      ${intl.formatMessage(
        {
          id: "reminder.text",
          defaultMessage:
            "We remind you that {senderName} ({senderEmail}) sent you a petition and some of the requested information has not yet been submitted.",
        },
        { senderName, senderEmail }
      )}
      
      ${renderSlateText(body)}

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
    fullName,
    senderName,
    senderEmail,
    fields,
    body,
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
            <GreetingFormal fullName={fullName} />
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
        {body ? (
          <MjmlSection padding="0 20px">
            <MjmlColumn
              backgroundColor="#f6f6f6"
              borderRadius="4px"
              padding="10px 0"
            >
              <RenderSlate value={body} />
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
