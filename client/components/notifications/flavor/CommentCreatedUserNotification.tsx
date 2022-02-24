import { gql } from "@apollo/client";
import { Circle, Text } from "@chakra-ui/react";
import { CommentIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { UserReference } from "@parallel/components/petition-activity/UserReference";
import { CommentCreatedUserNotification_CommentCreatedUserNotificationFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface CommentCreatedUserNotificationProps {
  isFirst?: boolean;
  notification: CommentCreatedUserNotification_CommentCreatedUserNotificationFragment;
}

export const CommentCreatedUserNotification = Object.assign(
  forwardRef<HTMLElement, CommentCreatedUserNotificationProps>(
    function CommentCreatedUserNotification({ isFirst, notification }, ref) {
      const { author, isInternal } = notification.comment;
      const name =
        author?.__typename === "PetitionAccess" ? (
          <ContactReference draggable="false" tabIndex={-1} contact={author.contact} />
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
          <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
        </Text>
      );
      return (
        <PetitionUserNotification
          ref={ref}
          isFirst={isFirst}
          notification={notification}
          icon={
            <Circle size="36px" background="gray.200">
              <CommentIcon fontSize="16px" />
            </Circle>
          }
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
  ),
  {
    fragments: {
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
                  ...ContactReference_Contact
                }
              }
            }
          }
        }
        ${PetitionUserNotification.fragments.PetitionUserNotification}
        ${UserReference.fragments.User}
        ${ContactReference.fragments.Contact}
      `,
    },
  }
);
