import { MjmlColumn, MjmlSection, MjmlText } from "mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { Email } from "../buildEmail";
import { Button } from "../components/Button";
import { GreetingUser } from "../components/Greeting";
import { Layout, LayoutProps } from "../components/Layout";
import {
  PetitionFieldAndComments,
  PetitionFieldAndCommentsProps,
} from "../components/PetitionFieldAndCommentsList";
import { closing, greetingUser } from "../components/texts";

export type PetitionCommentsUserNotificationProps = {
  userName: string | null;
  petitionName: string | null;
  petitionId: string;
  fields: PetitionFieldAndCommentsProps["fields"];
} & LayoutProps;

const email: Email<PetitionCommentsUserNotificationProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject({ petitionName }, intl: IntlShape) {
    return intl.formatMessage(
      {
        id: "petition-comments-user-notification.subject",
        defaultMessage:
          "New comments on {petitionName, select, null{your petition} other{{petitionName}}}",
      },
      { petitionName }
    );
  },
  text(
    {
      userName,
      fields,
      petitionName,
      petitionId,
      parallelUrl,
    }: PetitionCommentsUserNotificationProps,
    intl: IntlShape
  ) {
    const commentCount = fields.reduce((acc, f) => acc + f.comments.length, 0);

    return outdent`
      ${greetingUser({ name: userName }, intl)}
      ${intl.formatMessage(
        {
          id: "petition-comments-user-notification.intro-text",
          defaultMessage:
            "You have {count, plural, =1{# new comment} other{# new comments}} on {petitionName, select, null{your petition} other{{petitionName}}}:",
        },
        { count: commentCount, petitionName }
      )}

      ${intl.formatMessage({
        id: "petition-comments-user-notification.access-click-link",
        defaultMessage: "Follow the link below link to read and reply to the comments.",
      })}
      ${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/replies

      ${closing({}, intl)}
    `;
  },
  html({
    userName,
    petitionName,
    petitionId,
    fields,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: PetitionCommentsUserNotificationProps) {
    const { locale } = useIntl();
    const commentCount = fields.reduce((acc, f) => acc + f.comments.length, 0);
    return (
      <Layout assetsUrl={assetsUrl} parallelUrl={parallelUrl} logoUrl={logoUrl} logoAlt={logoAlt}>
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingUser name={userName} />
            <MjmlText>
              <FormattedMessage
                id="petition-comments-user-notification.intro-text"
                defaultMessage="You have {count, plural, =1{# new comment} other{# new comments}} on {petitionName, select, null{your petition} other{{petitionName}}}:"
                values={{
                  count: commentCount,
                  petitionName: petitionName ? <b>{petitionName}</b> : null,
                }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <PetitionFieldAndComments fields={fields} />

        <MjmlSection>
          <MjmlColumn>
            <Button href={`${parallelUrl}/${locale}/app/petitions/${petitionId}/replies`}>
              <FormattedMessage
                id="petition-comments-user-notification.access-button"
                defaultMessage="Reply to the comments"
              />
            </Button>
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export default email;
