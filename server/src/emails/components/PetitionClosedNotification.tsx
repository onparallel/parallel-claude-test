import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage } from "react-intl";
import { Email } from "../buildEmail";

import { Disclaimer } from "../common/Disclaimer";
import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";

import { RenderSlate } from "../common/RenderSlate";
import { disclaimer, greeting, renderSlateText } from "../common/texts";

export type PetitionClosedNotificationProps = {
  senderName: string;
  senderEmail: string;
  body: any | null;
} & LayoutProps;

const email: Email<PetitionClosedNotificationProps> = {
  from({ senderName }, intl) {
    return intl.formatMessage(
      {
        id: "from.via-parallel",
        defaultMessage: "{senderName} (via Parallel)",
      },
      { senderName }
    );
  },
  subject({ senderName }, intl) {
    return intl.formatMessage(
      {
        id: "petition-closed-notification.subject",
        defaultMessage: "{senderName} confirmed receipt of the information.",
      },
      { senderName }
    );
  },
  text({ senderName, senderEmail, body }, intl) {
    return outdent`
      ${greeting({ name: null }, intl)}
      ${intl.formatMessage(
        {
          id: "petition-closed-notification.text",
          defaultMessage:
            "{senderName} ({senderEmail}) has confirmed receipt of the information.",
        },
        { senderName, senderEmail }
      )}

      ${renderSlateText(body)}

      
      ${disclaimer({ email: senderEmail }, intl)}
    `;
  },
  html({
    senderName,
    senderEmail,
    body,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: PetitionClosedNotificationProps) {
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
      >
        <MjmlSection paddingBottom="10px">
          <MjmlColumn>
            <Greeting name={null} />
            <MjmlText>
              <FormattedMessage
                id="petition-closed-notification.text"
                defaultMessage="{senderName} ({senderEmail}) has confirmed receipt of the information."
                values={{
                  senderName: <b>{senderName}</b>,
                  senderEmail: <b>{senderEmail}</b>,
                }}
              />
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
            <MjmlSpacer height="10px" />
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection>
          <Disclaimer email={senderEmail} />
        </MjmlSection>
      </Layout>
    );
  },
};
export default email;

export const props: PetitionClosedNotificationProps = {
  senderName: "Santi",
  senderEmail: "santi@parallel.so",
  body: [
    { children: [{ text: "Hola," }] },
    { children: [{ text: "" }] },
    {
      children: [
        {
          text: "Ya hemos revisado toda la información. ",
        },
        {
          text: "Te confirmamos que está todo correcto.",
        },
      ],
    },
    { children: [{ text: "" }] },
    {
      children: [
        {
          text:
            " Vamos a ponernos a trabajar y si tenemos cualquier duda o necesitamos cualquier información más te lo haremos saber.",
        },
      ],
    },
    { children: [{ text: "" }] },
    { children: [{ text: "Un saludo." }] },
  ],
  parallelUrl: "https://staging.parallel.so",
  assetsUrl: "https://static-staging.parallel.so",
  logoUrl: "http://localhost/static/emails/logo.png",
  logoAlt: "Parallel",
};
