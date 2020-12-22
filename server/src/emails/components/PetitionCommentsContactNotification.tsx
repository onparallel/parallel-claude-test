import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { GreetingFormal } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import {
  PetitionFieldAndComments,
  PetitionFieldAndCommentsProps,
} from "../common/PetitionFieldAndCommentsList";
import { closing, greetingFormal } from "../common/texts";

export type PetitionCommentsContactNotificationProps = {
  authorName: string | null;
  authorEmail: string;
  contactFullName: string | null;
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
      authorEmail,
      contactFullName,
      keycode,
      parallelUrl,
    }: PetitionCommentsContactNotificationProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greetingFormal({ fullName: contactFullName }, intl)}
      ${intl.formatMessage(
        {
          id: "petition-comments-contact-notification.intro-text",
          defaultMessage:
            "{ name } ({ email }) has included comments to the information. You can review them below:",
        },
        { name: authorName, email: authorEmail }
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
    authorName,
    authorEmail,
    contactFullName,
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
        showGdprDisclaimer
      >
        <MjmlSection paddingBottom="10px">
          <MjmlColumn>
            <GreetingFormal fullName={contactFullName} />
            <MjmlText>
              <FormattedMessage
                id="petition-comments-contact-notification.intro-text"
                defaultMessage="{ name } ({ email }) has included comments to the information. You can review them below:"
                values={{
                  name: <b>{authorName}</b>,
                  email: <b>{authorEmail}</b>,
                }}
              />
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
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
