import { gql } from "@apollo/client";
import { Box, Button, Circle, MenuItem, MenuList, Spacer, Stack, Text } from "@chakra-ui/react";
import { PublicPetitionFieldComment_PublicPetitionFieldCommentFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { isMetaReturn } from "@parallel/utils/keys";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { DateTime } from "./DateTime";
import { GrowingTextarea } from "./GrowingTextarea";
import { MoreOptionsMenuButton } from "./MoreOptionsMenuButton";
import { PublicPetitionFieldCommentContent } from "./PublicPetitionFieldCommentContent";

export function PublicPetitionFieldComment({
  comment,
  onDelete,
  onEdit,
  isDisabled,
}: {
  comment: PublicPetitionFieldComment_PublicPetitionFieldCommentFragment;
  onDelete: () => void;
  onEdit: (content: string) => void;
  isDisabled?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<string>(comment.contentPlainText ?? "");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const isAuthor = comment.author?.__typename === "PublicContact" && comment.author.isMe;

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        editorRef.current?.focus();
        editorRef.current?.setSelectionRange(content.length, content.length);
      });
    }
  }, [isEditing]);

  function handleEditClick() {
    setContent(comment.contentPlainText ?? "");
    setIsEditing(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
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
      paddingX={5}
      paddingY={2}
      position="relative"
      backgroundColor={comment.isUnread ? "primary.50" : "white"}
    >
      {comment.isUnread ? (
        <Circle
          size={2}
          backgroundColor="primary.400"
          position="absolute"
          top="50%"
          transform="translateY(-50%)"
          insetStart={2}
        />
      ) : null}
      <Box fontSize="sm" display="flex" alignItems="center">
        <Box paddingEnd={2}>
          {isAuthor ? (
            <Text as="strong" fontStyle="italic">
              <FormattedMessage id="generic.you" defaultMessage="You" />
            </Text>
          ) : isNonNullish(comment.author) ? (
            <Text as="strong">{comment.author.fullName}</Text>
          ) : (
            <FormattedMessage id="generic.unknown" defaultMessage="Unknown" />
          )}
        </Box>
        <DateTime color="gray.500" value={comment.createdAt} format={FORMATS.LLL} useRelativeTime />
        <Spacer />
        {isAuthor ? (
          <MoreOptionsMenuButton
            isDisabled={comment.isAnonymized}
            variant="ghost"
            size="xs"
            options={
              <MenuList minWidth="160px">
                <MenuItem onClick={handleEditClick} isDisabled={isDisabled}>
                  <FormattedMessage id="generic.edit" defaultMessage="Edit" />
                </MenuItem>
                <MenuItem onClick={onDelete} isDisabled={isDisabled}>
                  <FormattedMessage id="generic.delete" defaultMessage="Delete" />
                </MenuItem>
              </MenuList>
            }
          />
        ) : null}
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
          <GrowingTextarea
            id={`comment-editor-${comment.id}`}
            ref={editorRef}
            value={content}
            onKeyDown={handleKeyDown as any}
            onChange={(e) => setContent(e.target.value)}
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
        <PublicPetitionFieldCommentContent fontSize="md" comment={comment} />
      )}
    </Box>
  );
}

PublicPetitionFieldComment.fragments = {
  PublicPetitionFieldComment: gql`
    fragment PublicPetitionFieldComment_PublicPetitionFieldComment on PublicPetitionFieldComment {
      id
      contentPlainText
      ...PublicPetitionFieldCommentContent_PetitionFieldComment
      createdAt
      isUnread
      author {
        ... on PublicUser {
          id
          fullName
        }
        ... on PublicContact {
          id
          fullName
          isMe
        }
      }
      isAnonymized
    }
    ${PublicPetitionFieldCommentContent.fragments.PetitionFieldComment}
  `,
};
