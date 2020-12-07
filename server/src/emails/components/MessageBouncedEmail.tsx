import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { Closing } from "../common/Closing";
import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { RenderSlate } from "../common/RenderSlate";
import { closing, greeting, renderSlateText } from "../common/texts";

export type MessageBouncedEmailProps = {
  senderName: string | null;
  contactEmail: string;
  contactFullName: string | null;
  petitionId: string;
  body: any | null;
} & LayoutProps;

const email: Email<MessageBouncedEmailProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "petition-message-bounced.subject",
      defaultMessage: "We couldn't deliver your message",
    });
  },
  text(
    {
      senderName,
      contactEmail,
      contactFullName,
      petitionId,
      parallelUrl,
      body,
    }: MessageBouncedEmailProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greeting({ name: senderName }, intl)}
      ${intl.formatMessage(
        {
          id: "petition-message-bounced.intro-text",
          defaultMessage:
            "We couldn't deliver the message you just sent to {contactFullName} ({contactEmail}):",
        },
        { contactFullName, contactEmail }
      )}

      ${renderSlateText(body)}

      ${intl.formatMessage(
        {
          id: "petition-message-bounced.intro-text-2",
          defaultMessage:
            "Please, verify that the email {contactEmail} is correct and try again.",
        },
        { contactEmail: <b>{contactEmail}</b> }
      )}

      ${intl.formatMessage({
        id: "petition-message-bounced.access-click-link",
        defaultMessage: "Follow the link below to access the petition.",
      })}
      ${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/activity

      ${closing({}, intl)}
    `;
  },
  html({
    body,
    senderName,
    contactEmail,
    contactFullName,
    petitionId,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: MessageBouncedEmailProps) {
    const { locale } = useIntl();
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
      >
        <MjmlSection backgroundColor="#6059f7" borderRadius="4px">
          <MjmlText align="center" color="white" fontWeight={600}>
            ACTION REQUIRED
          </MjmlText>
        </MjmlSection>

        <MjmlSection paddingBottom="10px">
          <MjmlColumn>
            <Greeting name={senderName} />
            <MjmlText>
              <FormattedMessage
                id="petition-message-bounced.intro-text"
                defaultMessage="We couldn't deliver the message you just sent to {contactFullName} ({contactEmail}):"
                values={{ contactFullName, contactEmail }}
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
          </MjmlColumn>
        </MjmlSection>

        <MjmlSection>
          <MjmlColumn>
            <MjmlText>
              <FormattedMessage
                id="petition-message-bounced.intro-text-2"
                defaultMessage="Please, verify that the email {contactEmail} is correct and try again."
                values={{ contactEmail: <b>{contactEmail}</b> }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <MjmlSection paddingTop="0px">
          <MjmlColumn>
            <Button
              href={`${parallelUrl}/${locale}/app/petitions/${petitionId}/activity`}
            >
              <FormattedMessage
                id="petition-sharing-notification.access-button"
                defaultMessage="Access the petition here"
              />
            </Button>
            <Closing />
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;

export const props: MessageBouncedEmailProps = {
  senderName: "Santi",
  contactEmail: "mariano@parallels.so",
  contactFullName: "Mariano Rodriguez",
  petitionId: "1234567890",
  parallelUrl: "http://localhost",
  assetsUrl: "https://static-staging.parallel.so",
  logoUrl: "http://localhost/static/emails/logo.png",
  logoAlt: "Parallel",
  body: [{ children: [{ text: "Completame los siguientes datos porfa" }] }],
};
