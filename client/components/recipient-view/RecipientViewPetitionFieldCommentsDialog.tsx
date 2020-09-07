import { gql } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Collapse,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalProps,
  ModalOverlay,
  Portal,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/core";
import { CommentIcon, MoreVerticalIcon } from "@parallel/chakra/icons";
import {
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment,
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { useFocus } from "@parallel/utils/useFocus";
import { usePreviousValue } from "beautiful-react-hooks";
import {
  ChangeEvent,
  Fragment,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { BreakLines } from "../common/BreakLines";
import { DateTime } from "../common/DateTime";
import { DeletedContact } from "../common/DeletedContact";
import { Divider } from "../common/Divider";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { SmallPopover } from "../common/SmallPopover";
import { Spacer } from "../common/Spacer";

export function RecipientViewPetitionFieldCommentsDialog({
  contactId,
  field,
  onAddComment,
  onDeleteComment,
  onUpdateComment,
  ...props
}: {
  contactId: string;
  field: RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragment;
  onAddComment: (content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onUpdateComment: (commentId: string, content: string) => void;
} & ModalProps) {
  const intl = useIntl();

  const [draft, setDraft] = useState("");
  const [inputFocused, inputFocusBind] = useFocus({ onBlurDelay: 300 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bttom when a comment is added
  const commentsRef = useRef<HTMLDivElement>(null);
  const previousCommentCount = usePreviousValue(field.comments.length);
  useEffect(() => {
    if (
      previousCommentCount === undefined ||
      field.comments.length > previousCommentCount
    ) {
      commentsRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
    }
  }, [field.comments.length, previousCommentCount]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && event.metaKey) {
      event.preventDefault();
      onAddComment(draft);
      setNativeValue(textareaRef.current!, "");
    }
  }

  function handleDraftChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
  }

  function handleSubmitClick() {
    onAddComment(draft.trim());
    setNativeValue(textareaRef.current!, "");
  }

  function handleCancelClick() {
    setNativeValue(textareaRef.current!, "");
  }

  const isExpanded = Boolean(inputFocused || draft);

  return (
    <Modal {...props}>
      <ModalOverlay>
        <ModalContent borderRadius="md" maxHeight="calc(100vh - 7.5rem)">
          <ModalHeader fontSize="lg" fontWeight="bold">
            {field.title || (
              <Text fontWeight="normal" textStyle="hint">
                <FormattedMessage
                  id="generic.untitled-field"
                  defaultMessage="Untitled field"
                />
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton
            aria-label={intl.formatMessage({
              id: "generic.close",
              defaultMessage: "Close",
            })}
          />
          <Divider />
          <ModalBody
            padding={0}
            overflow="auto"
            minHeight="0"
            ref={commentsRef}
          >
            {field.comments.map((comment, i) => (
              <Fragment key={comment.id}>
                {i !== 0 ? <Divider /> : null}
                <FieldComment
                  key={comment.id}
                  comment={comment}
                  contactId={contactId}
                  onEdit={(content) => onUpdateComment(comment.id, content)}
                  onDelete={() => onDeleteComment(comment.id)}
                />
              </Fragment>
            ))}
            {field.comments.length === 0 ? (
              <Flex
                flexDirection="column"
                paddingX={4}
                paddingY={8}
                justifyContent="center"
                alignItems="center"
              >
                <CommentIcon color="gray.200" boxSize="64px" />
                <Text color="gray.400">
                  <FormattedMessage
                    id="recipient-view.field-comments.cta"
                    defaultMessage="Have any questions? Ask here"
                  />
                </Text>
              </Flex>
            ) : null}
          </ModalBody>
          <Divider />
          <ModalFooter display="block">
            <GrowingTextarea
              ref={textareaRef}
              height="20px"
              size="sm"
              borderRadius="md"
              paddingX={2}
              minHeight={0}
              rows={1}
              placeholder={intl.formatMessage({
                id: "recipient-view.field-comments.placeholder",
                defaultMessage: "Type a new comment",
              })}
              value={draft}
              onKeyDown={handleKeyDown as any}
              onChange={handleDraftChange as any}
              {...inputFocusBind}
            />
            <Collapse isOpen={isExpanded} paddingTop={2}>
              <Stack direction="row" justifyContent="flex-end">
                <Button size="sm" onClick={handleCancelClick}>
                  <FormattedMessage
                    id="generic.cancel"
                    defaultMessage="Cancel"
                  />
                </Button>
                <Button
                  size="sm"
                  colorScheme="purple"
                  isDisabled={draft.trim().length === 0}
                  onClick={handleSubmitClick}
                >
                  <FormattedMessage
                    id="generic.submit"
                    defaultMessage="Submit"
                  />
                </Button>
              </Stack>
            </Collapse>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}

function FieldComment({
  comment,
  contactId,
  onDelete,
  onEdit,
}: {
  comment: RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment;
  contactId: string;
  onDelete: () => void;
  onEdit: (content: string) => void;
}) {
  const intl = useIntl();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleEditClick() {
    setContent(comment.content);
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current!.focus();
      textareaRef.current!.select();
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && event.metaKey) {
      event.preventDefault();
      setIsEditing(false);
      onEdit(content);
    }
  }

  function handleCancelClick() {
    setIsEditing(false);
  }

  function handleSaveClick() {
    setIsEditing(false);
    onEdit(content);
  }

  function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setContent(event.target.value);
  }

  return (
    <Box
      paddingX={6}
      paddingY={2}
      backgroundColor={
        !comment.publishedAt
          ? "yellow.50"
          : comment.isUnread
          ? "purple.50"
          : "white"
      }
    >
      <Box fontSize="sm" display="flex" alignItems="center">
        <Box as="strong" marginRight={2}>
          {comment.author?.id === contactId ? (
            <Text fontStyle="italic">
              <FormattedMessage id="generic.you" defaultMessage="You" />
            </Text>
          ) : comment.author?.__typename === "PublicContact" ? (
            comment.author.fullName
          ) : comment.author?.__typename === "PublicUser" ? (
            comment.author.fullName
          ) : (
            <DeletedContact />
          )}
        </Box>
        {comment.publishedAt ? (
          <DateTime
            color="gray.500"
            value={comment.publishedAt}
            format={FORMATS.LLL}
            useRelativeTime
          />
        ) : (
          <SmallPopover
            content={
              <Text fontSize="sm">
                <FormattedMessage
                  id="petition-replies.pending-comment-popover"
                  defaultMessage="Send all your pending comments at once to notify in a single email"
                />
              </Text>
            }
          >
            <Badge colorScheme="yellow" variant="outline" cursor="default">
              <FormattedMessage
                id="petition-replies.comment-pending.label"
                defaultMessage="Pending"
              />
            </Badge>
          </SmallPopover>
        )}
        <Spacer />
        {contactId === comment.author?.id ? (
          <Menu placement="bottom-end">
            <Tooltip
              label={intl.formatMessage({
                id: "generic.more-options",
                defaultMessage: "More options...",
              })}
            >
              <MenuButton
                as={IconButton}
                variant="ghost"
                size="xs"
                icon={<MoreVerticalIcon />}
                aria-label={intl.formatMessage({
                  id: "generic.more-options",
                  defaultMessage: "More options...",
                })}
              />
            </Tooltip>
            <Portal>
              <MenuList minWidth="160px">
                <MenuItem onClick={handleEditClick}>
                  <FormattedMessage id="generic.edit" defaultMessage="Edit" />
                </MenuItem>
                <MenuItem onClick={onDelete}>
                  <FormattedMessage
                    id="generic.delete"
                    defaultMessage="Delete"
                  />
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        ) : null}
      </Box>
      {isEditing ? (
        <Box marginTop={1} marginX={-2}>
          <GrowingTextarea
            ref={textareaRef}
            height="20px"
            size="sm"
            borderRadius="md"
            paddingX={2}
            minHeight={0}
            rows={1}
            value={content}
            onKeyDown={handleKeyDown as any}
            onChange={handleContentChange as any}
          />
          <Stack direction="row" justifyContent="flex-end" marginTop={2}>
            <Button size="sm" onClick={handleCancelClick}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
            <Button size="sm" colorScheme="purple" onClick={handleSaveClick}>
              <FormattedMessage id="generic.save" defaultMessage="Save" />
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box fontSize="sm">
          <BreakLines text={content} />
        </Box>
      )}
    </Box>
  );
}

RecipientViewPetitionFieldCommentsDialog.fragments = {
  get PublicPetitionField() {
    return gql`
      fragment RecipientViewPetitionFieldCommentsDialog_PublicPetitionField on PublicPetitionField {
        title
        comments {
          ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment
        }
      }
      ${this.PublicPetitionFieldComment}
    `;
  },
  get PublicPetitionFieldComment() {
    return gql`
      fragment RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment on PublicPetitionFieldComment {
        id
        author {
          ... on PublicUser {
            id
            fullName
          }
          ... on PublicContact {
            id
            fullName
          }
        }
        content
        publishedAt
        isUnread
      }
    `;
  },
};
