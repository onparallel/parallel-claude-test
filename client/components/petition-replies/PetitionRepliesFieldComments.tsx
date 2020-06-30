import {
  Badge,
  Box,
  Button,
  Collapse,
  IconButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  Flex,
  Icon,
} from "@chakra-ui/core";
import { Card, CardHeader } from "@parallel/components/common/Card";
import {
  PetitionRepliesFieldComments_PetitionFieldCommentFragment,
  PetitionRepliesFieldComments_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { useFocus } from "@parallel/utils/useFocus";
import { gql } from "apollo-boost";
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
import { ButtonDropdown } from "../common/ButtonDropdown";
import { ContactLink } from "../common/ContactLink";
import { DateTime } from "../common/DateTime";
import { DeletedContact } from "../common/DeletedContact";
import { Divider } from "../common/Divider";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { SmallPopover } from "../common/SmallPopover";
import { Spacer } from "../common/Spacer";

export type PetitionRepliesFieldCommentsProps = {
  field: PetitionRepliesFieldComments_PetitionFieldFragment;
  userId: string;
  onAddComment: (value: string) => void;
  onDeleteComment: (petitionFieldCommentId: string) => void;
  onUpdateComment: (petitionFieldCommentId: string, content: string) => void;
  onClose: () => void;
};

export function PetitionRepliesFieldComments({
  field,
  userId,
  onAddComment,
  onDeleteComment,
  onUpdateComment,
  onClose,
}: PetitionRepliesFieldCommentsProps) {
  const intl = useIntl();

  const [draft, setDraft] = useState("");
  const [inputFocused, inputFocusBind] = useFocus({ onBlurDelay: 300 });

  const commentsRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bttom when a comment is added
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
    onAddComment(draft);
    setNativeValue(textareaRef.current!, "");
  }

  function handleCancelClick() {
    setNativeValue(textareaRef.current!, "");
  }

  const isExpanded = Boolean(inputFocused || draft);

  return (
    <Card>
      <CardHeader isCloseable onClose={onClose}>
        {field.title || (
          <Text color="gray.400" fontWeight="normal" fontStyle="italic">
            <FormattedMessage
              id="generic.untitled-field"
              defaultMessage="Untitled field"
            />
          </Text>
        )}
      </CardHeader>
      <Box
        maxHeight={{
          base: `calc(100vh - 364px)`,
          sm: `calc(100vh - 300px)`,
          md: `calc(100vh - 300px)`,
        }}
        overflow="auto"
        ref={commentsRef}
      >
        {field.comments.map((comment, index) => (
          <Fragment key={comment.id}>
            <FieldComment
              comment={comment}
              userId={userId}
              onEdit={(content) => onUpdateComment(comment.id, content)}
              onDelete={() => onDeleteComment(comment.id)}
            />
            {index === field.comments.length - 1 ? null : <Divider />}
          </Fragment>
        ))}
        {field.comments.length === 0 ? (
          <Flex
            flexDirection="column"
            paddingX={4}
            justifyContent="center"
            alignItems="center"
            height="120px"
          >
            <Box color="gray.200">
              <Icon name="comment" size="64px" />
            </Box>
          </Flex>
        ) : null}
      </Box>
      <Divider />
      <Box padding={2}>
        <GrowingTextarea
          ref={textareaRef}
          height="20px"
          size="sm"
          rounded="md"
          paddingX={2}
          minHeight={0}
          {...{ rows: 1 }}
          placeholder={intl.formatMessage({
            id: "petition-replies.field-comments.placeholder",
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
      </Box>
    </Card>
  );
}

function FieldComment({
  comment,
  userId,
  onDelete,
  onEdit,
}: {
  comment: PetitionRepliesFieldComments_PetitionFieldCommentFragment;
  userId: string;
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
      paddingX={4}
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
          {comment.author?.id === userId ? (
            <Text fontStyle="italic">
              <FormattedMessage id="generic.you" defaultMessage="You" />
            </Text>
          ) : comment.author?.__typename === "Contact" ? (
            <ContactLink contact={comment.author} />
          ) : comment.author?.__typename === "User" ? (
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
        <ButtonDropdown
          as={IconButton}
          color="gray.400"
          _hover={{ color: "gray.600", backgroundColor: "gray.100" }}
          dropdown={
            <MenuList minWidth="160px" placement="bottom-end">
              {comment.author?.id === userId ? (
                <MenuItem onClick={handleEditClick}>
                  <FormattedMessage id="generic.edit" defaultMessage="Edit" />
                </MenuItem>
              ) : null}
              <MenuItem onClick={onDelete}>
                <FormattedMessage id="generic.delete" defaultMessage="Delete" />
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

PetitionRepliesFieldComments.fragments = {
  get PetitionField() {
    return gql`
      fragment PetitionRepliesFieldComments_PetitionField on PetitionField {
        title
        type
        comments {
          ...PetitionRepliesFieldComments_PetitionFieldComment
        }
        replies {
          ...PetitionRepliesFieldComments_PetitionFieldReply
        }
      }
      fragment PetitionRepliesFieldComments_PetitionFieldReply on PetitionFieldReply {
        id
        content
      }
      ${this.PetitionFieldComment}
      ${ContactLink.fragments.Contact}
    `;
  },
  get PetitionFieldComment() {
    return gql`
      fragment PetitionRepliesFieldComments_PetitionFieldComment on PetitionFieldComment {
        id
        author {
          ... on User {
            id
            fullName
          }
          ... on Contact {
            ...ContactLink_Contact
          }
        }
        content
        publishedAt
        isUnread
      }
    `;
  },
};
