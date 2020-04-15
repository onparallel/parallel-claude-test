import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import React from "react";
import { FormattedMessage, useIntl, IntlShape } from "react-intl";
import { Button } from "../common/Button";
import { Closing } from "../common/Closing";
import { DateTime } from "../common/DateTime";
import { Greeting } from "../common/Greeting";
import { Layout } from "../common/Layout";
import { RenderSlate } from "../common/RenderSlate";
import { FORMATS } from "../utils/dates";
import outdent from "outdent";
import {
  greeting,
  closing,
  renderSlateText,
  petitionFieldList,
} from "../common/texts";
import { PetitionFieldList } from "../common/PetitionFieldList";

export interface PetitionReminderProps {
  name: string | null;
  senderName: string;
  senderEmail: string;
  fields: { id: number; title: string | null }[];
  subject: string | null;
  body: any;
  deadline: Date | null;
  keycode: string;
  parallelUrl: string;
  assetsUrl: string;
}

export default {
  subject: function ({ subject }: PetitionReminderProps, intl: IntlShape) {
    return intl.formatMessage(
      {
        id: "petition-reminder.subject",
        defaultMessage: "Reminder! {subject}",
      },
      { subject }
    );
  },
  text: function PetitionReminder(
    {
      name,
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
      ${greeting({ name }, intl)}
      ${intl.formatMessage(
        {
          id: "reminder.text",
          defaultMessage:
            "Remember that {senderName} ({senderEmail}) sent you a petition.",
        },
        { senderName, senderEmail }
      )}
      
      ${renderSlateText(body)}

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

      ${closing({}, intl)}
    `;
  },
  html: function PetitionReminder({
    name,
    senderName,
    senderEmail,
    fields,
    body,
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
        <MjmlSection padding="0 20px">
          <MjmlColumn
            backgroundColor="#f6f6f6"
            borderRadius="4px"
            padding="10px 0"
          >
            <RenderSlate value={body} />
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
                      <span
                        style={{ fontWeight: 600, textDecoration: "underline" }}
                      >
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
              ></FormattedMessage>
            </Button>
            <MjmlSpacer height="10px" />
            <Closing />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export const props: PetitionReminderProps = {
  name: "Santi",
  senderName: "Derek",
  senderEmail: "derek@parallel.so",
  subject: null,
  body: [
    {
      children: [
        { text: "hola Derek, envimae los " },
        { text: "documentos " },
        { text: "siguientes ", bold: true },
        { text: "super guays", bold: true, underline: true },
      ],
    },
    {
      type: "bulleted-list",
      children: [
        {
          children: [{ text: "foto", bold: true, underline: true }],
          type: "list-item",
        },
        {
          children: [{ text: "pasaporte", italic: true }],
          type: "list-item",
        },
      ],
    },
  ],
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
