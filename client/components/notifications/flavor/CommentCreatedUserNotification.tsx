import { gql } from "@apollo/client";
import { Avatar, Text } from "@chakra-ui/react";
import { CommentIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { UserReference } from "@parallel/components/petition-activity/UserReference";
import { NotificationComment_CommentCreatedUserNotificationFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface NotificationCommentProps {
  notification: NotificationComment_CommentCreatedUserNotificationFragment;
}

export function CommentCreatedUserNotification({
  notification,
}: NotificationCommentProps) {
  const { author, isInternal } = notification.comment;
  const name =
    author?.__typename === "PetitionAccess" ? (
      <ContactLink contact={author.contact} />
    ) : (
      <UserReference user={author as any} />
    );
  const field = notification.field.title ? (
    <Text as="span">
      {'"'}
      {notification.field.title}
      {'"'}
    </Text>
  ) : (
    <Text as="span" textStyle="hint">
      <FormattedMessage
        id="generic.untitled-field"
        defaultMessage="Untitled field"
      />
    </Text>
  );
  return (
    <PetitionUserNotification
      notification={notification}
      icon={<NotificationAvatar />}
      path={`/replies?comments=${notification.field.id}`}
    >
      {isInternal ? (
        <FormattedMessage
          id="component.notification-internal-comment.body"
          defaultMessage="{name} has written an internal comment in the field {field}."
          values={{ name, field }}
        />
      ) : (
        <FormattedMessage
          id="component.notification-comment.body"
          defaultMessage="{name} has written a comment in the field {field}."
          values={{ name, field }}
        />
      )}
    </PetitionUserNotification>
  );
}

function NotificationAvatar() {
  return (
    <Avatar
      height="36px"
      width="36px"
      background="gray.200"
      icon={<CommentIcon fontSize="1rem" />}
    />
  );
}

CommentCreatedUserNotification.fragments = {
  CommentCreatedUserNotification: gql`
    fragment CommentCreatedUserNotification_CommentCreatedUserNotification on CommentCreatedUserNotification {
      ...PetitionUserNotification_PetitionUserNotification
      field {
        id
        title
      }
      comment {
        id
        isInternal
        author {
          ... on User {
            ...UserReference_User
          }
          ... on PetitionAccess {
            contact {
              ...ContactLink_Contact
            }
          }
        }
      }
    }
    ${PetitionUserNotification.fragments.PetitionUserNotification}
    ${UserReference.fragments.User}
    ${ContactLink.fragments.Contact}
  `,
};
