import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { DateTime } from "../common/DateTime";
import { Disclaimer } from "../common/Disclaimer";
import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import {
  PetitionFieldList,
  PetitionFieldListProps,
} from "../common/PetitionFieldList";
import { RenderSlate } from "../common/RenderSlate";
import {
  disclaimer,
  greeting,
  petitionFieldList,
  renderSlateText,
} from "../common/texts";
import { FORMATS } from "../utils/dates";

export type PetitionMessageProps = {
  name: string | null;
  senderName: string;
  senderEmail: string;
  fields: PetitionFieldListProps["fields"];
  subject: string | null;
  body: any | null;
  deadline: Date | null;
  keycode: string;
} & LayoutProps;

const email: Email<PetitionMessageProps> = {
  from({ senderName }, intl) {
    return intl.formatMessage(
      {
        id: "from.via-parallel",
        defaultMessage: "{senderName} (via Parallel)",
      },
      { senderName }
    );
  },
  subject({ subject }, intl) {
    return subject || "";
  },
  text(
    {
      name,
      senderName,
      senderEmail,
      fields,
      body,
      deadline,
      keycode,
      parallelUrl,
    },
    intl
  ) {
    return outdent`
      ${greeting({ name }, intl)}
      ${intl.formatMessage(
        {
          id: "new-petition.text",
          defaultMessage: "{senderName} ({senderEmail}) sent you a petition:",
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
      
      ${disclaimer({ email: senderEmail }, intl)}
    `;
  },
  html({
    name,
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
  }: PetitionMessageProps) {
    const { locale } = useIntl();

    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
      >
        <MjmlSection paddingBottom="10px">
          <MjmlColumn>
            <Greeting name={name} />
            <MjmlText>
              <FormattedMessage
                id="new-petition.text"
                defaultMessage="{senderName} ({senderEmail}) sent you a petition:"
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
              ></FormattedMessage>
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

export const props: PetitionMessageProps = {
  name: "Derek",
  senderName: "Santi",
  senderEmail: "santi@parallel.so",
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
      children: [{ text: "hmmm" }],
    },
    {
      type: "bulleted-list",
      children: [
        {
          children: [
            {
              type: "paragraph",
              children: [{ text: "foto", bold: true, underline: true }],
                },
              ],
          type: "list-item",
            },
            {
              children: [
                {
              type: "paragraph",
              children: [{ text: "pasaporte", italic: true }],
            },
            {
              type: "bulleted-list",
              children: [
                {
                  children: [
                    {
                      type: "paragraph",
                      children: [{ text: "foto", bold: true, underline: true }],
                    },
                  ],
                      type: "list-item",
                },
                {
                      children: [
                        {
                          type: "paragraph",
                      children: [{ text: "pasaporte", italic: true }],
                            },
                          ],
                  type: "list-item",
                        },
                      ],
                    },
                  ],
          type: "list-item",
        },
      ],
    },
  ],
  deadline: null,
  // deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  fields: [
    { position: 0, id: 123, title: "DNI" },
    { position: 1, id: 235, title: "Escrituras" },
    { position: 2, id: 345, title: "Certificado de rentas del trabajo" },
    { position: 3, id: 32, title: "Prueba" },
    { position: 4, id: 6905, title: null },
  ],
  keycode: "asdfghjkl",
  parallelUrl: "https://staging.parallel.so",
  assetsUrl: "https://static-staging.parallel.so",
  logoUrl: "http://localhost/static/emails/logo.png",
  logoAlt: "Parallel",
};
