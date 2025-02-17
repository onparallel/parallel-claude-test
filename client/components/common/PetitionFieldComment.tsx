import { gql } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Circle,
  HStack,
  MenuItem,
  MenuList,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ThumbsDownIcon, ThumbsUpIcon } from "@parallel/chakra/icons";
import { PetitionFieldComment_PetitionFieldCommentFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { isMetaReturn } from "@parallel/utils/keys";
import { useIsGlobalKeyDown } from "@parallel/utils/useIsGlobalKeyDown";
import { KeyboardEvent, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { DateTime } from "./DateTime";
import { FileAttachmentButton } from "./FileAttachmentButton";
import { MoreOptionsMenuButton } from "./MoreOptionsMenuButton";
import { PetitionFieldCommentContent } from "./PetitionFieldCommentContent";
import { SmallPopover } from "./SmallPopover";
import { UserOrContactReference } from "./UserOrContactReference";
import {
  CommentEditor,
  CommentEditorInstance,
  CommentEditorProps,
  CommentEditorValue,
} from "./slate/CommentEditor";

interface PetitionFieldCommentProps
  extends Pick<CommentEditorProps, "defaultMentionables" | "onSearchMentionables"> {
  comment: PetitionFieldComment_PetitionFieldCommentFragment;
  onDelete: () => void;
  onEdit: (content: CommentEditorValue) => void;
  onDownloadAttachment: (attachmentId: string, commentId: string, preview: boolean) => void;
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
  onDownloadAttachment,
  isDisabled,
}: PetitionFieldCommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<CommentEditorValue>(comment.content);
  const editorRef = useRef<CommentEditorInstance>(null);

  const isAuthor = comment.author?.__typename === "User" && comment.author.isMe;

  const isShiftDown = useIsGlobalKeyDown("Shift");

  function handleEditClick() {
    setContent(comment.content);
    setIsEditing(true);
    requestAnimationFrame(() => {
      editorRef.current?.focus();
    });
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

  const approvalMetadata = comment.isApproval ? comment.approvalMetadata : null;

  return (
    <Box
      paddingX={5}
      paddingY={2}
      position="relative"
      backgroundColor={
        comment.isUnread
          ? "primary.50"
          : comment.isInternal || comment.isApproval
            ? "yellow.50"
            : "white"
      }
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
      <Box fontSize="sm" display="flex" alignItems="center" minHeight="24px">
        <Box paddingEnd={2}>
          <UserOrContactReference
            userOrAccess={comment.author}
            userUseYou
            _activeContact={{ fontWeight: "bold" }}
          />
        </Box>
        {comment.isApproval ? (
          <SmallPopover
            content={
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.petition-field-comment.note-popover"
                  defaultMessage="This message is only visible for people in your organization."
                />
              </Text>
            }
          >
            <Badge color="gray.600" variant="outline" cursor="default" marginEnd={2}>
              <FormattedMessage id="generic.approval-badge" defaultMessage="Evaluation" />
            </Badge>
          </SmallPopover>
        ) : comment.isInternal ? (
          <SmallPopover
            content={
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.petition-field-comment.note-popover"
                  defaultMessage="This message is only visible for people in your organization."
                />
              </Text>
            }
          >
            <Badge color="gray.600" variant="outline" cursor="default" marginEnd={2}>
              <FormattedMessage id="generic.note" defaultMessage="Note" />
            </Badge>
          </SmallPopover>
        ) : null}
        <DateTime color="gray.500" value={comment.createdAt} format={FORMATS.LLL} useRelativeTime />
        {comment.isEdited ? (
          <Text as="span" color="gray.400" marginStart={2} fontSize="xs">
            <FormattedMessage id="generic.edited-indicator" defaultMessage="Edited" />
          </Text>
        ) : null}
        <Spacer />
        {comment.isApproval ? null : (
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
        )}
      </Box>
      {isNonNullish(approvalMetadata) ? (
        <HStack fontSize="sm" fontWeight={500}>
          <Text as="span">{approvalMetadata.stepName}:</Text>
          {approvalMetadata.status === "APPROVED" ? (
            <HStack color="green.600" spacing={1}>
              <ThumbsUpIcon />
              <Text as="span">
                <FormattedMessage
                  id="component.petition-field-comment.approval-status-approved"
                  defaultMessage="Approved"
                />
              </Text>
            </HStack>
          ) : approvalMetadata.status === "REJECTED" ? (
            <HStack color="red.600" spacing={1}>
              <ThumbsDownIcon />
              <Text as="span">
                {approvalMetadata.rejectionType === "TEMPORARY" ? (
                  <FormattedMessage
                    id="component.petition-field-comment.approval-status-rejected"
                    defaultMessage="Rejected (changes requested)"
                  />
                ) : (
                  <FormattedMessage
                    id="component.petition-field-comment.approval-status-rejected-definitive"
                    defaultMessage="Rejected (definitive)"
                  />
                )}
              </Text>
            </HStack>
          ) : approvalMetadata.status === "SKIPPED" ? (
            <HStack color="green.600" spacing={1}>
              <ThumbsUpIcon />
              <Text as="span">
                <FormattedMessage
                  id="component.petition-field-comment.approval-status-skipped"
                  defaultMessage="Approved (forced)"
                />
              </Text>
            </HStack>
          ) : null}
        </HStack>
      ) : null}
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
      {isNonNullish(comment.attachments) ? (
        <HStack marginTop={1} flexWrap="wrap">
          {comment.attachments.map((attachment) => {
            return (
              <FileAttachmentButton
                key={attachment.id}
                file={attachment.file}
                onClick={() => onDownloadAttachment(attachment.id, comment.id, !isShiftDown)}
              />
            );
          })}
        </HStack>
      ) : null}
    </Box>
  );
}

PetitionFieldComment.fragments = {
  PetitionFieldComment: gql`
    fragment PetitionFieldComment_PetitionFieldComment on PetitionFieldComment {
      id
      createdAt
      content
      ...PetitionFieldCommentContent_PetitionFieldComment
      isUnread
      isInternal
      isEdited
      isApproval
      approvalMetadata
      attachments {
        id
        file {
          ...FileAttachmentButton_FileUpload
        }
      }
      author {
        ...UserOrContactReference_UserOrPetitionAccess
      }
      isAnonymized
    }
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
    ${PetitionFieldCommentContent.fragments.PetitionFieldComment}
    ${FileAttachmentButton.fragments.FileUpload}
  `,
};
