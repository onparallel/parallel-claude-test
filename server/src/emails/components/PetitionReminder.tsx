import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { DateTime } from "../common/DateTime";
import { Disclaimer } from "../common/Disclaimer";
import { Greeting } from "../common/Greeting";
import { Layout } from "../common/Layout";
import { PetitionFieldList } from "../common/PetitionFieldList";
import { disclaimer, greeting, petitionFieldList } from "../common/texts";
import { FORMATS } from "../utils/dates";

export interface PetitionReminderProps {
  name: string | null;
  senderName: string;
  senderEmail: string;
  fields: { id: number; title: string | null }[];
  deadline: Date | null;
  keycode: string;
  parallelUrl: string;
  assetsUrl: string;
}

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
      name,
      senderName,
      senderEmail,
      fields,
      deadline,
      keycode,
      parallelUrl,
    }: PetitionReminderProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greeting({ name }, intl)}
      ${intl.formatMessage(
        {
          id: "reminder.text",
          defaultMessage:
            "Remember that {senderName} ({senderEmail}) sent you a petition.",
        },
        { senderName, senderEmail }
      )}

      ${
        deadline
          ? intl.formatMessage(
              {
                id: "generic.submit-text.with-deadline",
                defaultMessage:
                  "Please submit the following information before {deadline}:",
              },
              { deadline: intl.formatDate(deadline, FORMATS.LLL) }
            )
          : intl.formatMessage({
              id: "generic.submit-text.without-deadline",
              defaultMessage: "Please submit the following information:",
            })
      }
      ${petitionFieldList({ fields }, intl)}

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
    name,
    senderName,
    senderEmail,
    fields,
    deadline,
    keycode,
    parallelUrl,
    assetsUrl,
  }: PetitionReminderProps) {
    const { locale } = useIntl();
    return (
      <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl}>
        <MjmlSection paddingBottom="10px">
          <MjmlColumn>
            <Greeting name={name} />
            <MjmlText>
              <FormattedMessage
                id="reminder.text"
                defaultMessage="Remember that {senderName} ({senderEmail}) sent you a petition."
                values={{
                  senderName: <b>{senderName}</b>,
                  senderEmail: <b>{senderEmail}</b>,
                }}
              ></FormattedMessage>
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection paddingTop="10px">
          <MjmlColumn>
            <MjmlText>
              {deadline ? (
                <FormattedMessage
                  id="generic.submit-text.with-deadline"
                  defaultMessage="Please submit the following information before {deadline}:"
                  values={{
                    deadline: (
                      <span style={{ textDecoration: "underline" }}>
                        <DateTime
                          value={deadline}
                          format={FORMATS.LLL}
                        ></DateTime>
                      </span>
                    ),
                  }}
                />
              ) : (
                <FormattedMessage
                  id="generic.submit-text.without-deadline"
                  defaultMessage="Please submit the following information:"
                />
              )}
            </MjmlText>
            <PetitionFieldList fields={fields} />
            <MjmlSpacer height="10px" />
            <Button href={`${parallelUrl}/${locale}/petition/${keycode}`}>
              <FormattedMessage
                id="generic.complete-information-button"
                defaultMessage="Complete the information here"
              />
            </Button>
            <MjmlSpacer height="10px" />
            <Disclaimer email={senderEmail} />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

export const props: PetitionReminderProps = {
  name: "Santi",
  senderName: "Derek",
  senderEmail: "derek@parallel.so",
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  fields: [
    { id: 1, title: "DNI" },
    { id: 2, title: "Escrituras" },
    { id: 3, title: "Certificado de rentas del trabajo" },
    { id: 4, title: "Prueba" },
    { id: 5, title: null },
  ],
  keycode: "asdfghjkl",
  assetsUrl: "http://localhost",
  parallelUrl: "http://localhost",
};
