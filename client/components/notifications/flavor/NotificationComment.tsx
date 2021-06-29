import { gql } from "@apollo/client";
import { Avatar, Text } from "@chakra-ui/react";
import { CommentIcon } from "@parallel/chakra/icons";
import {
  PetitionBase,
  PetitionField,
  PetitionFieldComment,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { Notification } from "./Notification";

export interface NotificationCommentProps {
  id: string;
  petition: PetitionBase;
  field: PetitionField;
  comment: PetitionFieldComment;
  createdAt: string;
  isRead: boolean;
}

export function NotificationComment({
  id,
  petition,
  field,
  comment,
  createdAt,
  isRead,
}: NotificationCommentProps) {
  const intl = useIntl();

  const { author, isInternal } = comment;

  const name = author
    ? author.__typename === "PetitionAccess"
      ? author.contact?.fullName
      : author.__typename === "User"
      ? author.fullName
      : ""
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
      body={body}
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
      field {
        id
        title
      }
      comment {
        isInternal
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
      }
    }
  `,
};
