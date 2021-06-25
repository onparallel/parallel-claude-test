import { gql } from "@apollo/client";
import { CommentIcon } from "@parallel/chakra/icons";
import { Notification, NotificationBody } from "./Notification";
import { Avatar, Text } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  PetitionBase,
  PetitionField,
  UserOrPetitionAccess,
} from "@parallel/graphql/__types";

export interface NotificationCommentProps {
  id: string;
  petition: PetitionBase;
  author: UserOrPetitionAccess;
  field: PetitionField;
  isInternal: boolean;
  createdAt: string;
  isRead: boolean;
}

export function NotificationComment({
  id,
  petition,
  author,
  field,
  isInternal,
  createdAt,
  isRead,
}: NotificationCommentProps) {
  const intl = useIntl();

  const name =
    author.__typename === "PetitionAccess"
      ? author.contact?.fullName
      : author.__typename === "User"
      ? author.fullName
      : "";

  const petitionTitle =
    petition.name ??
    intl.formatMessage({
      id: "generic.untitled-petition",
      defaultMessage: "Untitled petition",
    });

  const fieldTitle =
    field.title ??
    intl.formatMessage({
      id: "generic.untitled-field",
      defaultMessage: "Untitled field",
    });

  const body = isInternal ? (
    <FormattedMessage
      id="ccomponent.notification-internal-comment.body"
      defaultMessage='<b>{name}</b> has written an internal comment in the field "{field}".'
      values={{
        name: name,
        b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
        field: fieldTitle,
      }}
    />
  ) : (
    <FormattedMessage
      id="component.notification-comment.body"
      defaultMessage='<b>{name}</b> has written a comment in the field "{field}".'
      values={{
        name: name,
        b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
        field: fieldTitle,
      }}
    />
  );

  return (
    <Notification
      id={id}
      icon={<NotificationAvatar />}
      body={<NotificationBody body={body} />}
      title={petitionTitle}
      timestamp={createdAt}
      isRead={isRead}
    />
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

NotificationComment.fragments = {
  CommentCreatedUserNotification: gql`
    fragment NotificationComment_CommentCreatedUserNotification on CommentCreatedUserNotification {
      id
      petition {
        id
        name
      }
      author {
        ... on User {
          id
          fullName
        }
        ... on PetitionAccess {
          contact {
            id
            fullName
            email
          }
        }
      }
      isInternal
      createdAt
    }
  `,
};
