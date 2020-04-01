import {
  MjmlSpacer,
  MjmlText,
  MjmlWrapper,
  MjmlSection,
  MjmlColumn,
} from "mjml-react";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Closing } from "../components/Closing";
import { Button } from "../components/common/Button";
import { DateTime } from "../components/common/DateTime";
import { Greeting } from "../components/Greeting";
import { Layout } from "../components/Layout";
import { RenderSlate } from "../components/RenderSlate";
import { FORMATS } from "../utils/dates";

export interface PetitionReminderProps {
  name: string;
  senderName: string;
  senderEmail: string;
  fields: { id: string; title: string | null }[];
  body: any;
  deadline: string | null;
  keycode: string;
  parallelUrl: string;
  assetsUrl: string;
}

export default function NewPetition({
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
        <MjmlColumn backgroundColor="#f6f6f6" borderRadius="4px">
          <MjmlText color="#000000" padding="10px 20px">
            <RenderSlate value={body} />
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
          <MjmlText paddingTop={0}>
            <ol style={{ margin: 0 }}>
              {fields.map(({ id, title }) => (
                <li key={id} style={{ marginTop: "10px" }}>
                  {title ? (
                    <span style={{ fontWeight: "bold" }}>{title}</span>
                  ) : (
                    <span style={{ fontStyle: "italic" }}>
                      <FormattedMessage
                        id="generic.untitled-field"
                        defaultMessage="Untitled field"
                      />
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </MjmlText>
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
}

export const props: PetitionReminderProps = {
  name: "Santi",
  senderName: "Derek",
  senderEmail: "derek@parallel.so",
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
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  fields: [
    { id: "1", title: "DNI" },
    { id: "2", title: "Escrituras" },
    { id: "3", title: "Certificado de rentas del trabajo" },
    { id: "4", title: "Prueba" },
    { id: "5", title: null },
  ],
  keycode: "asdfghjkl",
  assetsUrl: "http://localhost",
  parallelUrl: "http://localhost",
};
