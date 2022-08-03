import { gql } from "@apollo/client";
import { Circle, Text } from "@chakra-ui/react";
import { CommentIcon, MentionIcon, NoteIcon } from "@parallel/chakra/icons";
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
      const {
        comment: { author, isInternal: isNote },
        isMention,
      } = notification;

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
            <Circle size="36px" background={isMention ? "blue.500" : "gray.200"}>
              {isMention ? (
                <MentionIcon color="white" />
              ) : isNote ? (
                <NoteIcon fontSize="16px" />
              ) : (
                <CommentIcon fontSize="16px" />
              )}
            </Circle>
          }
          path={`/replies?comments=${notification.field.id}`}
        >
          {isMention ? (
            <FormattedMessage
              id="component.notification-mention-comment.body"
              defaultMessage="{name} has mentioned you in the field {field}."
              values={{ name: <UserOrContactReference userOrAccess={author} />, field }}
            />
          ) : isNote ? (
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
          isMention
        }
        ${PetitionUserNotification.fragments.PetitionUserNotification}
        ${UserOrContactReference.fragments.UserOrPetitionAccess}
        ${UserReference.fragments.User}
        ${ContactReference.fragments.Contact}
      `,
    },
  }
);
