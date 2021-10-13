import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../common/Button";
import { GreetingContact } from "../common/Greeting";
import { Layout, LayoutProps } from "../common/Layout";
import {
  PetitionFieldAndComments,
  PetitionFieldAndCommentsProps,
} from "../common/PetitionFieldAndCommentsList";
import { closing, greetingContact } from "../common/texts";

export type PetitionCommentsContactNotificationProps = {
  contactFullName: string;
  contactName: string;
  keycode: string;
  emailSubject: string | null;
  fields: PetitionFieldAndCommentsProps["fields"];
  tone: string;
} & LayoutProps;

const email: Email<PetitionCommentsContactNotificationProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel team",
    });
  },
  subject({ emailSubject, tone }, intl: IntlShape) {
    return intl.formatMessage(
      {
        id: "petition-comments-contact-notification.subject",
        defaultMessage: "New comments on {subject, select, null{your petition} other{{subject}}}",
      },
      { subject: emailSubject, tone }
    );
  },
  text(
    {
      fields,
      contactName: name,
      contactFullName: fullName,
      keycode,
      parallelUrl,
      emailSubject,
      tone,
    }: PetitionCommentsContactNotificationProps,
    intl: IntlShape
  ) {
    const commentCount = fields.reduce((acc, f) => acc + f.comments.length, 0);
    return outdent`
      ${greetingContact({ name, fullName, tone }, intl)}

      ${intl.formatMessage(
        {
          id: "petition-comments-contact-notification.intro-text",
          defaultMessage:
            "You have {count, plural, =1{# new comment} other{# new comments}} on {subject, select, null{your petition} other{{subject}}}:",
        },
        { count: commentCount, subject: emailSubject }
      )}

      ${intl.formatMessage({
        id: "petition-comments-contact-notification.access-click-link",
        defaultMessage: "Follow the link below link to read and reply to the comments.",
      })}
      ${parallelUrl}/${intl.locale}/petition/${keycode}

      ${closing({}, intl)}
    `;
  },
  html({
    contactName: name,
    contactFullName: fullName,
    keycode,
    fields,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
    emailSubject,
    tone,
  }: PetitionCommentsContactNotificationProps) {
    const { locale } = useIntl();
    const commentCount = fields.reduce((acc, f) => acc + f.comments.length, 0);

    return (
      <Layout
        useAlternativeSlogan
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        tone={tone}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingContact name={name} fullName={fullName} tone={tone} />

            <MjmlText>
              <FormattedMessage
                id="petition-comments-contact-notification.intro-text"
                defaultMessage="You have {count, plural, =1{# new comment} other{# new comments}} on {subject, select, null{your petition} other{{subject}}}:"
                values={{
                  count: commentCount,
                  subject: emailSubject ? <b>{emailSubject}</b> : null,
                  tone,
                }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <PetitionFieldAndComments fields={fields} />

        <MjmlSection>
          <MjmlColumn>
            <Button
              href={`${parallelUrl}/${locale}/petition/${keycode}`}
              fontWeight={500}
              fontSize={"16px"}
            >
              <FormattedMessage
                id="petition-comments-contact-notification.access-button"
                defaultMessage="Reply to the comments"
                values={{ tone }}
              />
            </Button>
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
