import { gql } from "@apollo/client";
import { Circle } from "@chakra-ui/react";
import { CommentIcon, MentionIcon, NoteIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { PetitionFieldReference } from "@parallel/components/common/PetitionFieldReference";
import { UserOrContactReference } from "@parallel/components/common/UserOrContactReference";
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
        isGeneral,
        field,
      } = notification;

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
          path={`/replies?comments=${isGeneral ? "general" : notification.field?.id ?? ""}`}
        >
          {isGeneral ? (
            isMention ? (
              <FormattedMessage
                id="component.notification-mention.body-general-chat"
                defaultMessage="{name} has mentioned you in <b>General</b>."
                values={{
                  name: <UserOrContactReference userOrAccess={author} />,
                }}
              />
            ) : isNote ? (
              <FormattedMessage
                id="component.notification-internal-comment.body-general-chat"
                defaultMessage="{name} has added a note in <b>General</b>."
                values={{
                  name: <UserOrContactReference userOrAccess={author} />,
                }}
              />
            ) : (
              <FormattedMessage
                id="component.notification-comment.body-general-chat"
                defaultMessage="{name} has written a comment in <b>General</b>."
                values={{
                  name: <UserOrContactReference userOrAccess={author} />,
                }}
              />
            )
          ) : isMention ? (
            <FormattedMessage
              id="component.notification-mention-comment.body"
              defaultMessage="{name} has mentioned you in the field {field}."
              values={{
                name: <UserOrContactReference userOrAccess={author} />,
                field: <PetitionFieldReference field={field} />,
              }}
            />
          ) : isNote ? (
            <FormattedMessage
              id="component.notification-internal-comment.body"
              defaultMessage="{name} has added a note in the field {field}."
              values={{
                name: <UserOrContactReference userOrAccess={author} />,
                field: <PetitionFieldReference field={field} />,
              }}
            />
          ) : (
            <FormattedMessage
              id="component.notification-comment.body"
              defaultMessage="{name} has written a comment in the field {field}."
              values={{
                name: <UserOrContactReference userOrAccess={author} />,
                field: <PetitionFieldReference field={field} />,
              }}
            />
          )}
        </PetitionUserNotification>
      );
    },
  ),
  {
    fragments: {
      CommentCreatedUserNotification: gql`
        fragment CommentCreatedUserNotification_CommentCreatedUserNotification on CommentCreatedUserNotification {
          ...PetitionUserNotification_PetitionUserNotification
          field {
            ...PetitionFieldReference_PetitionField
          }
          comment {
            id
            isInternal
            author {
              ...UserOrContactReference_UserOrPetitionAccess
            }
          }
          isMention
          isGeneral
        }
        ${PetitionUserNotification.fragments.PetitionUserNotification}
        ${PetitionFieldReference.fragments.PetitionField}
        ${UserOrContactReference.fragments.UserOrPetitionAccess}
        ${ContactReference.fragments.Contact}
      `,
    },
  },
);
