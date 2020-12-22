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
  authorNameOrEmail: string;
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
  subject({ authorNameOrEmail, petitionName }, intl: IntlShape) {
    return intl.formatMessage(
      {
        id: "petition-comments-user-notification.subject",
        defaultMessage:
          "{ nameOrEmail } commented on { petitionName, select, null {your petition} other {{petitionName}}}",
      },
      { nameOrEmail: authorNameOrEmail, petitionName }
    );
  },
  text(
    {
      userName,
      authorNameOrEmail,
      petitionName,
      petitionId,
      parallelUrl,
    }: PetitionCommentsUserNotificationProps,
    intl: IntlShape
  ) {
    return outdent`
      ${greeting({ name: userName }, intl)}
      ${intl.formatMessage(
        {
          id: "petition-comments-user-notification.intro-text",
          defaultMessage:
            "{ nameOrEmail } commented on { petitionName, select, null {your petition} other {{petitionName}}}:",
        },
        { nameOrEmail: authorNameOrEmail, petitionName }
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
    userName: name,
    authorNameOrEmail,
    petitionName,
    petitionId,
    fields,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
  }: PetitionCommentsUserNotificationProps) {
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
            <Greeting name={name} />
            <MjmlText>
              <FormattedMessage
                id="petition-comments-user-notification.intro-text"
                defaultMessage="{ nameOrEmail } commented on { petitionName, select, null {your petition} other {{petitionName}}}:"
                values={{
                  nameOrEmail: <b>{authorNameOrEmail}</b>,
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
