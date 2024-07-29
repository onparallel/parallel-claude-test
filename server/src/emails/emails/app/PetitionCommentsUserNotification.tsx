import { MjmlColumn, MjmlSection, MjmlText } from "@faire/mjml-react";
import outdent from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { isDefined, sumBy, uniqBy } from "remeda";
import { toGlobalId } from "../../../util/globalId";
import { Email } from "../../buildEmail";
import { Button } from "../../components/Button";
import { GreetingUser } from "../../components/Greeting";
import { Layout, LayoutProps } from "../../components/Layout";
import {
  PetitionFieldAndComments,
  PetitionFieldAndCommentsProps,
} from "../../components/PetitionFieldAndCommentsList";
import { closing, greetingUser } from "../../components/texts";

type PetitionCommentsUserNotificationProps = {
  userName: string | null;
  petitionName: string | null;
  petitionId: string;
  fieldsWithComments: PetitionFieldAndCommentsProps["fieldsWithComments"];
} & LayoutProps;

const email: Email<PetitionCommentsUserNotificationProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject({ petitionName, fieldsWithComments }, intl: IntlShape) {
    const commentsWithMentions = fieldsWithComments.flatMap(({ comments }) =>
      comments.filter((c) => c.mentions.filter((m) => m.highlight).length > 0),
    );

    return commentsWithMentions.length === 0
      ? intl.formatMessage(
          {
            id: "petition-comments-user-notification.subject",
            defaultMessage:
              "New comments on {petitionName, select, null{your parallel} other{{petitionName}}}",
          },
          { petitionName },
        )
      : intl.formatMessage(
          {
            id: "petition-comments-user-notification.subject-mention",
            defaultMessage:
              "{author} {uniqueAuthorCount, plural, =1{} other{and others}} mentioned you on {petitionName, select, null{your parallel} other{{petitionName}}}",
          },
          {
            author: commentsWithMentions[0].author.name,
            uniqueAuthorCount: uniqBy(commentsWithMentions, (m) => m.author.id).length,
            petitionName,
          },
        );
  },
  text(
    {
      userName,
      fieldsWithComments,
      petitionName,
      petitionId,
      parallelUrl,
    }: PetitionCommentsUserNotificationProps,
    intl: IntlShape,
  ) {
    const commentsWithMentions = fieldsWithComments.flatMap(({ comments }) =>
      comments.filter((c) => c.mentions.length > 0),
    );
    const mentionCount = commentsWithMentions.flatMap((c) =>
      c.mentions.filter((m) => m.highlight),
    ).length;

    const commentCount =
      sumBy(fieldsWithComments, ({ comments }) => comments.length) - mentionCount;
    const onlyComments = mentionCount === 0;
    const onlyMentions = commentCount === 0;
    const firstFieldWithCommentsId = isDefined(fieldsWithComments[0].field)
      ? toGlobalId("PetitionField", fieldsWithComments[0].field.id)
      : "general";

    return outdent`
      ${greetingUser({ name: userName }, intl)}
     ${
       onlyComments
         ? intl.formatMessage(
             {
               id: "petition-comments-user-notification.intro-text.comments",
               defaultMessage:
                 "You have {count, plural, =1{# new comment} other{# new comments}} on {petitionName, select, null{your parallel} other{{petitionName}}}:",
             },
             { count: commentCount, petitionName },
           )
         : onlyMentions
           ? intl.formatMessage(
               {
                 id: "petition-comments-user-notification.intro-text.mentions",
                 defaultMessage:
                   "You have {count, plural, =1{# mention} other{# mentions}} on {petitionName, select, null{your parallel} other{{petitionName}}}:",
               },
               { count: mentionCount, petitionName },
             )
           : intl.formatMessage(
               {
                 id: "petition-comments-user-notification.intro-text",
                 defaultMessage:
                   "You have {mentionCount, plural, =1{# mention} other{# mentions}} and {commentCount, plural, =1{# new comment} other{# new comments}} on {petitionName, select, null{your parallel} other{{petitionName}}}:",
               },
               { commentCount, mentionCount, petitionName },
             )
     }

      ${intl.formatMessage({
        id: "petition-comments-user-notification.access-click-link",
        defaultMessage: "Follow the link below link to read and reply to the comments.",
      })}
      ${parallelUrl}/${intl.locale}/app/petitions/${petitionId}/replies?comments=${firstFieldWithCommentsId}

      ${closing({}, intl)}
    `;
  },
  html({
    userName,
    petitionName,
    petitionId,
    fieldsWithComments,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
    theme,
  }: PetitionCommentsUserNotificationProps) {
    const { locale } = useIntl();

    const commentsWithMentions = fieldsWithComments.flatMap(({ comments }) =>
      comments.filter((c) => c.mentions.length > 0),
    );
    const mentionCount = commentsWithMentions.flatMap((c) =>
      c.mentions.filter((m) => m.highlight),
    ).length;

    const commentCount =
      sumBy(fieldsWithComments, ({ comments }) => comments.length) - mentionCount;
    const onlyComments = mentionCount === 0;
    const onlyMentions = commentCount === 0;

    const firstFieldWithCommentsId = isDefined(fieldsWithComments[0].field)
      ? toGlobalId("PetitionField", fieldsWithComments[0].field.id)
      : "general";

    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        theme={theme}
      >
        <MjmlSection padding="0">
          <MjmlColumn>
            <GreetingUser name={userName} />
            <MjmlText>
              {onlyComments ? (
                <FormattedMessage
                  id="petition-comments-user-notification.intro-text.comments"
                  defaultMessage="You have {count, plural, =1{# new comment} other{# new comments}} on {petitionName, select, null{your parallel} other{{petitionName}}}:"
                  values={{ count: commentCount, petitionName }}
                />
              ) : onlyMentions ? (
                <FormattedMessage
                  id="petition-comments-user-notification.intro-text.mentions"
                  defaultMessage="You have {count, plural, =1{# mention} other{# mentions}} on {petitionName, select, null{your parallel} other{{petitionName}}}:"
                  values={{ count: mentionCount, petitionName }}
                />
              ) : (
                <FormattedMessage
                  id="petition-comments-user-notification.intro-text"
                  defaultMessage="You have {mentionCount, plural, =1{# mention} other{# mentions}} and {commentCount, plural, =1{# new comment} other{# new comments}} on {petitionName, select, null{your parallel} other{{petitionName}}}:"
                  values={{ commentCount, mentionCount, petitionName }}
                />
              )}
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>

        <PetitionFieldAndComments fieldsWithComments={fieldsWithComments} />

        <MjmlSection>
          <MjmlColumn>
            <Button
              href={`${parallelUrl}/${locale}/app/petitions/${petitionId}/replies?comments=${firstFieldWithCommentsId}`}
            >
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
