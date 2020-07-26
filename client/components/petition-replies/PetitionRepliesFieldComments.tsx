import { gql } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Collapse,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/core";
import { CommentIcon, MoreVerticalIcon } from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import {
  PetitionRepliesFieldComments_PetitionFieldCommentFragment,
  PetitionRepliesFieldComments_PetitionFieldFragment,
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
import { ContactLink } from "../common/ContactLink";
import { DateTime } from "../common/DateTime";
import { DeletedContact } from "../common/DeletedContact";
import { Divider } from "../common/Divider";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
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

  const commentsRef = useRef<HTMLDivElement>(null);
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
            paddingY={8}
            justifyContent="center"
            alignItems="center"
            color="gray.200"
          >
            <CommentIcon boxSize="64px" />
          </Flex>
        ) : null}
      </Box>
      <Divider />
      <Box padding={2}>
        <GrowingTextarea
          id="petition-replies-comments-input"
          ref={textareaRef}
          height="20px"
          size="sm"
          borderRadius="md"
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
              colorScheme="purple"
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
  comment: { id, author, publishedAt, isUnread, isEdited, content: _content },
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
  const [content, setContent] = useState(_content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleEditClick() {
    setContent(_content);
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
        !publishedAt ? "yellow.50" : isUnread ? "purple.50" : "white"
      }
    >
      <Box fontSize="sm" display="flex" alignItems="center">
        <Box>
          {author?.__typename === "User" && author?.id === userId ? (
            <Text as="strong" fontStyle="italic">
              <FormattedMessage id="generic.you" defaultMessage="You" />
            </Text>
          ) : author?.__typename === "PetitionAccess" ? (
            author.contact ? (
              <Text as="strong">
                <ContactLink contact={author.contact!} />
              </Text>
            ) : (
              <DeletedContact />
            )
          ) : author?.__typename === "User" ? (
            <Text as="strong">{author.fullName}</Text>
          ) : null}
          {publishedAt ? (
            <>
              <DateTime
                color="gray.500"
                value={publishedAt}
                format={FORMATS.LLL}
                useRelativeTime
                marginLeft={2}
              />
              {isEdited ? (
                <Text as="span" color="gray.400" marginLeft={2} fontSize="xs">
                  <FormattedMessage
                    id="generic.edited-comment-indicator"
                    defaultMessage="Edited"
                  />
                </Text>
              ) : null}
            </>
          ) : null}
        </Box>
        {publishedAt ? null : (
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
            <Badge
              colorScheme="yellow"
              variant="outline"
              cursor="default"
              marginLeft={2}
            >
              <FormattedMessage
                id="petition-replies.comment-pending.label"
                defaultMessage="Pending"
              />
            </Badge>
          </SmallPopover>
        )}
        <Spacer />
        <Menu placement="bottom-end">
          <IconButtonWithTooltip
            as={MenuButton}
            variant="ghost"
            size="xs"
            icon={<MoreVerticalIcon />}
            color="gray.400"
            _hover={{ color: "gray.600", backgroundColor: "gray.100" }}
            label={intl.formatMessage({
              id: "generic.more-options",
              defaultMessage: "More options...",
            })}
          />
          <Portal>
            <MenuList minWidth="160px">
              {author?.__typename === "User" && author?.id === userId ? (
                <MenuItem onClick={handleEditClick}>
                  <FormattedMessage id="generic.edit" defaultMessage="Edit" />
                </MenuItem>
              ) : null}
              <MenuItem onClick={onDelete}>
                <FormattedMessage id="generic.delete" defaultMessage="Delete" />
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
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
            {...{ rows: 1 }}
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
          ... on PetitionAccess {
            contact {
              ...ContactLink_Contact
            }
          }
        }
        content
        publishedAt
        isUnread
        isEdited
      }
      ${ContactLink.fragments.Contact}
    `;
  },
};
