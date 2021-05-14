import { MjmlColumn, MjmlSection, MjmlSpacer, MjmlText } from "mjml-react";
import outdent from "outdent";
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
      defaultMessage: "Parallel team",
    });
  },
  subject({ petitionName }, intl: IntlShape) {
    return intl.formatMessage(
      {
        id: "petition-comments-user-notification.subject",
        defaultMessage:
          "You have new comments on { petitionName, select, null {your petition} other {{petitionName}}}",
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
      ${greeting({ name: userName }, intl)}
      ${intl.formatMessage(
        {
          id: "petition-comments-user-notification.intro-text",
          defaultMessage:
            "You have {count, plural, =1{# new comment} other{# new comments}} on { petitionName, select, null {your petition} other {{petitionName}}}:",
        },
        { count: commentCount, petitionName }
      )}

      ${intl.formatMessage({
        id: "petition-comments-user-notification.access-click-link",
        defaultMessage:
          "Follow the link below link to read and reply to the comments.",
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
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
      >
        <MjmlSection paddingBottom="10px">
          <MjmlColumn>
            <Greeting name={userName} />
            <MjmlText>
              <FormattedMessage
                id="petition-comments-user-notification.intro-text"
                defaultMessage="You have {count, plural, =1{# new comment} other{# new comments}} on { petitionName, select, null {your petition} other {{petitionName}}}:"
                values={{
                  count: commentCount,
                  petitionName: <b>{petitionName}</b>,
                }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <PetitionFieldAndComments fields={fields} />
        <MjmlSection paddingTop="0px">
          <MjmlColumn>
            <MjmlSpacer height="10px" />
            <Button
              href={`${parallelUrl}/${locale}/app/petitions/${petitionId}/replies`}
            >
              <FormattedMessage
                id="petition-comments-user-notification.access-button"
                defaultMessage="Reply to the comments here"
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
