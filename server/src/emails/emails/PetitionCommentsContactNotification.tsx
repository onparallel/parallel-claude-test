import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../components/Button";
import { GreetingContact } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import {
  PetitionFieldAndComments,
  PetitionFieldAndCommentsProps,
} from "../components/PetitionFieldAndCommentsList";
import { closing, greetingContact } from "../components/texts";

export type PetitionCommentsContactNotificationProps = {
  contactFullName: string;
  contactName: string;
  keycode: string;
  emailSubject: string | null;
  fields: PetitionFieldAndCommentsProps["fields"];
} & LayoutProps;

const email: Email<PetitionCommentsContactNotificationProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject({ emailSubject, theme }, intl: IntlShape) {
    return intl.formatMessage(
      {
        id: "petition-comments-contact-notification.subject",
        defaultMessage: "New comments on {subject, select, null{your parallel} other{{subject}}}",
      },
      { subject: emailSubject, tone: theme.preferredTone }
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
      theme,
    }: PetitionCommentsContactNotificationProps,
    intl: IntlShape
  ) {
    const commentCount = fields.reduce((acc, f) => acc + f.comments.length, 0);
    return outdent`
      ${greetingContact({ name, fullName, tone: theme.preferredTone }, intl)}

      ${intl.formatMessage(
        {
          id: "petition-comments-contact-notification.intro-text",
          defaultMessage:
            "You have {count, plural, =1{# new comment} other{# new comments}} on {subject, select, null{your parallel} other{{subject}}}:",
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
    removeParallelBranding,
    theme,
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
        utmCampaign="recipients"
        removeParallelBranding={removeParallelBranding}
        theme={theme}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingContact name={name} fullName={fullName} tone={theme.preferredTone} />

            <MjmlText>
              <FormattedMessage
                id="petition-comments-contact-notification.intro-text"
                defaultMessage="You have {count, plural, =1{# new comment} other{# new comments}} on {subject, select, null{your parallel} other{{subject}}}:"
                values={{
                  count: commentCount,
                  subject: emailSubject ? <b>{emailSubject}</b> : null,
                  tone: theme.preferredTone,
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
                defaultMessage="Click here to reply"
                values={{ tone: theme.preferredTone }}
              />
            </Button>
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
