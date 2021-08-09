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
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "petition-comments-contact-notification.subject",
      defaultMessage: "You have new comments on your petition",
    });
  },
  text(
    { fields, contactFullName, keycode, parallelUrl }: PetitionCommentsContactNotificationProps,
    intl: IntlShape
  ) {
    const commentCount = fields.reduce((acc, f) => acc + f.comments.length, 0);
    return outdent`
      ${greetingFormal({ fullName: contactFullName }, intl)}
      ${intl.formatMessage(
        {
          id: "petition-comments-contact-notification.intro-text",
          defaultMessage:
            "You have {count, plural, =1{# new comment} other{# new comments}} on your petition:",
        },
        { count: commentCount }
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
    contactFullName,
    keycode,
    fields,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: PetitionCommentsContactNotificationProps) {
    const { locale } = useIntl();
    const commentCount = fields.reduce((acc, f) => acc + f.comments.length, 0);

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
                defaultMessage="You have {count, plural, =1{# new comment} other{# new comments}} on your petition:"
                values={{ count: commentCount }}
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
