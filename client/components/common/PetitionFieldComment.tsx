import { gql } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Circle,
  MenuItem,
  MenuList,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react";
import { PetitionFieldComment_PetitionFieldCommentFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { isMetaReturn } from "@parallel/utils/keys";
import { KeyboardEvent, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../petition-activity/UserReference";
import { PetitionFieldCommentContent } from "./PetitionFieldCommentContent";
import { ContactReference } from "./ContactReference";
import { DateTime } from "./DateTime";
import { MoreOptionsMenuButton } from "./MoreOptionsMenuButton";
import {
  CommentEditor,
  CommentEditorInstance,
  CommentEditorProps,
  CommentEditorValue,
} from "./slate/CommentEditor";
import { SmallPopover } from "./SmallPopover";

interface PetitionFieldCommentProps
  extends Pick<CommentEditorProps, "defaultMentionables" | "onSearchMentionables"> {
  comment: PetitionFieldComment_PetitionFieldCommentFragment;
  onDelete: () => void;
  onEdit: (content: CommentEditorValue) => void;
  onMarkAsUnread?: () => void;
  isDisabled?: boolean;
}

export function PetitionFieldComment({
  comment,
  onDelete,
  onEdit,
  onMarkAsUnread,
  defaultMentionables,
  onSearchMentionables,
  isDisabled,
}: PetitionFieldCommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<CommentEditorValue>(comment.content);
  const editorRef = useRef<CommentEditorInstance>(null);

  const isAuthor = comment.author?.__typename === "User" && comment.author.isMe;

  function handleEditClick() {
    setContent(comment.content);
    setIsEditing(true);
    setTimeout(() => {
      editorRef.current?.focus();
    }, 100);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (isMetaReturn(event)) {
      event.preventDefault();
      handleSaveClick();
    }
  }

  function handleCancelClick() {
    setIsEditing(false);
  }

  function handleSaveClick() {
    setIsEditing(false);
    onEdit(content);
  }

  return (
    <Box
      paddingX={6}
      paddingY={2}
      position="relative"
      backgroundColor={comment.isUnread ? "primary.50" : comment.isInternal ? "yellow.50" : "white"}
    >
      {comment.isUnread ? (
        <Circle
          size={2}
          backgroundColor="primary.400"
          position="absolute"
          top="50%"
          transform="translateY(-50%)"
          left={2}
        />
      ) : null}
      <Box fontSize="sm" display="flex" alignItems="center">
        <Box paddingRight={2}>
          {comment.author?.__typename === "PetitionAccess" ? (
            <ContactReference contact={comment.author.contact} fontWeight="bold" />
          ) : comment.author?.__typename === "User" ? (
            comment.author.isMe ? (
              <Text as="strong" fontStyle="italic">
                <FormattedMessage id="generic.you" defaultMessage="You" />
              </Text>
            ) : (
              <UserReference user={comment.author} />
            )
          ) : (
            <UserReference user={null} />
          )}
        </Box>
        {comment.isInternal && (
          <SmallPopover
            content={
              <Text fontSize="sm">
                <FormattedMessage
                  id="petition-replies.note-popover"
                  defaultMessage="This note is only visible for people in your organization."
                />
              </Text>
            }
          >
            <Badge color="gray.600" variant="outline" cursor="default" marginRight={2}>
              <FormattedMessage id="generic.note" defaultMessage="Note" />
            </Badge>
          </SmallPopover>
        )}
        <DateTime color="gray.500" value={comment.createdAt} format={FORMATS.LLL} useRelativeTime />
        {comment.isEdited ? (
          <Text as="span" color="gray.400" marginLeft={2} fontSize="xs">
            <FormattedMessage id="generic.edited-indicator" defaultMessage="Edited" />
          </Text>
        ) : null}
        <Spacer />
        <MoreOptionsMenuButton
          isDisabled={comment.isAnonymized}
          variant="ghost"
          size="xs"
          options={
            <MenuList minWidth="160px">
              {isAuthor ? (
                <MenuItem onClick={handleEditClick} isDisabled={isDisabled}>
                  <FormattedMessage id="generic.edit" defaultMessage="Edit" />
                </MenuItem>
              ) : null}
              {!isAuthor ? (
                <MenuItem onClick={onMarkAsUnread} isDisabled={comment.isUnread}>
                  <FormattedMessage
                    id="component.replies-field-comment.mark-as-unread"
                    defaultMessage="Mark as unread"
                  />
                </MenuItem>
              ) : null}
              {isAuthor ? (
                <MenuItem onClick={onDelete} isDisabled={isDisabled}>
                  <FormattedMessage id="generic.delete" defaultMessage="Delete" />
                </MenuItem>
              ) : null}
            </MenuList>
          }
        />
      </Box>
      {comment.isAnonymized ? (
        <Box fontSize="md" textStyle="hint">
          <FormattedMessage
            id="component.field-comment.message-not-available"
            defaultMessage="Message not available"
          />
        </Box>
      ) : isEditing ? (
        <Box marginTop={1} marginX={-2}>
          <CommentEditor
            id={`petition-field-comment-${comment.id}`}
            ref={editorRef}
            value={content}
            defaultMentionables={defaultMentionables}
            onSearchMentionables={onSearchMentionables}
            onKeyDown={handleKeyDown}
            onChange={setContent}
          />
          <Stack direction="row" justifyContent="flex-end" marginTop={2}>
            <Button size="sm" onClick={handleCancelClick}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
            <Button size="sm" colorScheme="primary" onClick={handleSaveClick}>
              <FormattedMessage id="generic.save" defaultMessage="Save" />
            </Button>
          </Stack>
        </Box>
      ) : (
        <PetitionFieldCommentContent fontSize="md" comment={comment} />
      )}
    </Box>
  );
}

PetitionFieldComment.fragments = {
  PetitionFieldComment: gql`
    fragment PetitionFieldComment_PetitionFieldComment on PetitionFieldComment {
      id
      createdAt
      content
      content
      ...PetitionFieldCommentContent_PetitionFieldComment
      isUnread
      isInternal
      isEdited
      author {
        ... on User {
          id
          isMe
          ...UserReference_User
        }
        ... on PetitionAccess {
          id
          contact {
            ...ContactReference_Contact
          }
        }
      }
      isAnonymized
    }
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
    ${PetitionFieldCommentContent.fragments.PetitionFieldComment}
  `,
};
