import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import React from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { Closing } from "../common/Closing";
import { Greeting } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import { closing, greeting } from "../common/texts";
import {
  PetitionFieldAndCommentsProps,
  PetitionFieldAndComments,
} from "../common/PetitionFieldAndCommentsList";

export type PetitionCommentsContactNotificationProps = {
  authorName: string | null;
  contactName: string | null;
  keycode: string;
  fields: PetitionFieldAndCommentsProps["fields"];
} & LayoutProps;

const email: Email<PetitionCommentsContactNotificationProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
    });
  },
  subject({ authorName }, intl: IntlShape) {
    return intl.formatMessage(
      {
        id: "petition-comments-contact-notification.subject",
        defaultMessage: "{ name } commented on your petition",
      },
      { name: authorName }
    );
  },
  text(
    {
      authorName,
      contactName,
      keycode,
      parallelUrl,
    }: PetitionCommentsContactNotificationProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greeting({ name: contactName }, intl)}
      ${intl.formatMessage(
        {
          id: "petition-comments-contact-notification.intro-text",
          defaultMessage: "{ name } commented on your petition:",
        },
        { name: authorName }
      )}

      ${intl.formatMessage({
        id: "petition-comments-contact-notification.access-click-link",
        defaultMessage:
          "Follow the link below link to read and reply to the comments.",
      })}
      ${parallelUrl}/${intl.locale}/petition/${keycode}

      ${closing({}, intl)}
    `;
  },
  html({
    contactName,
    authorName,
    keycode,
    fields,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: PetitionCommentsContactNotificationProps) {
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
            <Greeting name={contactName} />
            <MjmlText>
              <FormattedMessage
                id="petition-comments-contact-notification.intro-text"
                defaultMessage="{ name } commented on your petition:"
                values={{
                  name: <b>{authorName}</b>,
                }}
              ></FormattedMessage>
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <PetitionFieldAndComments fields={fields} />
        <MjmlSection paddingTop="0px">
          <MjmlColumn>
            <MjmlSpacer height="10px" />
            <Button href={`${parallelUrl}/${locale}/petition/${keycode}`}>
              <FormattedMessage
                id="petition-comments-contact-notification.access-button"
                defaultMessage="See the comments here"
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

export const props: PetitionCommentsContactNotificationProps = {
  contactName: "Santi",
  authorName: "Derek",
  keycode: "1234567890",
  parallelUrl: "http://localhost",
  fields: [
    {
      id: 1,
      title: "Nominas",
      position: 2,
      comments: [
        {
          id: 1,
          content: "De dónde saco esto tio?\nNo lo encuentro por ningun lado",
        },
        {
          id: 2,
          content: "Ni caso, ya lo encontré",
        },
      ],
    },
    {
      id: 2,
      title: "Dividendos",
      position: 4,
      comments: [
        {
          id: 3,
          content: "Ya sale en el borrador",
        },
      ],
    },
  ],
  assetsUrl: "https://static-staging.parallel.so",
  logoUrl: "http://localhost/static/emails/logo.png",
  logoAlt: "Parallel",
};
