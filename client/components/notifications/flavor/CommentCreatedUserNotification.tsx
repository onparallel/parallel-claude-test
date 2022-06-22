import { gql } from "@apollo/client";
import { Circle, Text } from "@chakra-ui/react";
import { CommentIcon, NoteIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { UserOrContactReference } from "@parallel/components/petition-activity/UserOrContactReference";
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
      const { author, isInternal: isNote } = notification.comment;
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
              {isNote ? <NoteIcon fontSize="16px" /> : <CommentIcon fontSize="16px" />}
            </Circle>
          }
          path={`/replies?comments=${notification.field.id}`}
        >
          {isNote ? (
            <FormattedMessage
              id="component.notification-internal-comment.body"
              defaultMessage="{name} has added a note in the field {field}."
              values={{ name: <UserOrContactReference userOrAccess={author} />, field }}
            />
          ) : (
            <FormattedMessage
              id="component.notification-comment.body"
              defaultMessage="{name} has written a comment in the field {field}."
              values={{ name: <UserOrContactReference userOrAccess={author} />, field }}
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
              ...UserOrContactReference_UserOrPetitionAccess
            }
          }
        }
        ${PetitionUserNotification.fragments.PetitionUserNotification}
        ${UserOrContactReference.fragments.UserOrPetitionAccess}
        ${UserReference.fragments.User}
        ${ContactReference.fragments.Contact}
      `,
    },
  }
);
