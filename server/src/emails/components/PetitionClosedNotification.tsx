import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage } from "react-intl";
import { Email } from "../buildEmail";
import { Disclaimer } from "../common/Disclaimer";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { RenderSlate } from "../common/RenderSlate";
import { disclaimer, greetingFormal, renderSlateText } from "../common/texts";

export type PetitionClosedNotificationProps = {
  contactFullName: string | null;
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
  text({ contactFullName, senderName, senderEmail, body }, intl) {
    return outdent`
      ${greetingFormal({ fullName: contactFullName }, intl)}
      ${intl.formatMessage(
        {
          id: "petition-closed-notification.text",
          defaultMessage:
            "{senderName} ({senderEmail}) has received the information.",
        },
        { senderName, senderEmail }
      )}

      ${renderSlateText(body)}

      
      ${disclaimer({ email: senderEmail }, intl)}
    `;
  },
  html({
    contactFullName,
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
        showGdprDisclaimer
      >
        <MjmlSection paddingBottom="10px">
          <MjmlColumn>
            <GreetingFormal fullName={contactFullName} />
            <MjmlText>
              <FormattedMessage
                id="petition-closed-notification.text"
                defaultMessage="{senderName} ({senderEmail}) has received the information."
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
