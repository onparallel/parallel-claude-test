import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalOverlay,
  Badge,
  Box,
  Button,
  Collapse,
  IconButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  Icon,
} from "@chakra-ui/core";
import {
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment,
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { useFocus } from "@parallel/utils/useFocus";
import { gql } from "apollo-boost";
import { ChangeEvent, Fragment, KeyboardEvent, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ButtonDropdown } from "../common/ButtonDropdown";
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
  onClose,
}: {
  contactId: string;
  field: RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragment;
  onAddComment: (content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onUpdateComment: (commentId: string, content: string) => void;
  onClose: () => void;
}) {
  const intl = useIntl();

  const [draft, setDraft] = useState("");
  const [inputFocused, inputFocusBind] = useFocus({ onBlurDelay: 300 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    onAddComment(draft);
    setNativeValue(textareaRef.current!, "");
  }

  function handleCancelClick() {
    setNativeValue(textareaRef.current!, "");
  }

  const isExpanded = Boolean(inputFocused || draft);

  const closeRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal isOpen={true} onClose={onClose}>
      <ModalOverlay />
      <ModalContent rounded="md" maxHeight="calc(100vh - 7.5rem)">
        <ModalHeader fontSize="lg" fontWeight="bold">
          {field.title || (
            <Text color="gray.400" fontWeight="normal" fontStyle="italic">
              <FormattedMessage
                id="generic.untitled-field"
                defaultMessage="Untitled field"
              />
            </Text>
          )}
        </ModalHeader>
        <ModalCloseButton ref={closeRef} />
        <Divider />
        <ModalBody padding={0} overflow="auto" minHeight="0">
          {field.comments.map((comment, i) => (
            <>
              {i !== 0 ? <Divider /> : null}
              <FieldComment
                key={comment.id}
                comment={comment}
                contactId={contactId}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </>
          ))}
          {field.comments.length === 0 ? (
            <Box color="gray.200">
              <Icon name="comment" size="64px" />
            </Box>
          ) : null}
        </ModalBody>
        <Divider />
        <ModalFooter display="block">
          <GrowingTextarea
            ref={textareaRef}
            height="20px"
            size="sm"
            rounded="md"
            paddingX={2}
            minHeight={0}
            {...{ rows: 1 }}
            placeholder={intl.formatMessage({
              id: "recipient'view.field-comments.placeholder",
              defaultMessage: "Have any questions? Ask here",
            })}
            value={draft}
            onKeyDown={handleKeyDown as any}
            onChange={handleDraftChange as any}
            {...inputFocusBind}
          />
          <Collapse isOpen={isExpanded} paddingTop={2}>
            <Stack direction="row" justifyContent="flex-end">
              <Button size="sm" onClick={handleCancelClick}>
                <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
              </Button>
              <Button
                size="sm"
                variantColor="purple"
                isDisabled={draft.length === 0}
                onClick={handleSubmitClick}
              >
                <FormattedMessage id="generic.submit" defaultMessage="Submit" />
              </Button>
            </Stack>
          </Collapse>
        </ModalFooter>
      </ModalContent>
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
      backgroundColor={!comment.publishedAt ? "yellow.50" : "white"}
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
            <Badge variantColor="yellow" variant="outline" cursor="default">
              <FormattedMessage
                id="petition-replies.comment-pending.label"
                defaultMessage="Pending"
              />
            </Badge>
          </SmallPopover>
        )}
        <Spacer />
        {contactId === comment.author?.id ? (
          <ButtonDropdown
            as={IconButton}
            color="gray.400"
            _hover={{ color: "gray.600", backgroundColor: "gray.100" }}
            dropdown={
              <MenuList minWidth="160px" placement="bottom-end">
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
            }
            variant="ghost"
            size="xs"
            icon={"more-vertical" as any}
            aria-label={intl.formatMessage({
              id: "generic.more-options",
              defaultMessage: "More options...",
            })}
          />
        ) : null}
      </Box>
      {isEditing ? (
        <Box marginTop={1} marginX={-2}>
          <GrowingTextarea
            ref={textareaRef}
            height="20px"
            size="sm"
            rounded="md"
            paddingX={2}
            minHeight={0}
            {...{ rows: 1 }}
            value={content}
            onKeyDown={handleKeyDown as any}
            onChange={handleContentChange as any}
          />
          <Stack direction="row" justifyContent="flex-end" marginTop={2}>
            <Button size="sm" onClick={handleCancelClick}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
            <Button size="sm" variantColor="purple" onClick={handleSaveClick}>
              <FormattedMessage id="generic.save" defaultMessage="Save" />
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box fontSize="sm">
          {content.split("\n").map((line, index) => (
            <Fragment key={index}>
              {line}
              <br />
            </Fragment>
          ))}
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
      }
    `;
  },
};
