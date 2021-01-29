import { gql } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Collapse,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import {
  AlertCircleIcon,
  CommentIcon,
  MoreVerticalIcon,
} from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import {
  PetitionRepliesFieldComments_PetitionFieldCommentFragment,
  PetitionRepliesFieldComments_PetitionFieldFragment,
  PetitionReplies_UserFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { isMetaReturn } from "@parallel/utils/keys";
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
import { Divider } from "../common/Divider";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { HelpPopover } from "../common/HelpPopover";
import { Link } from "../common/Link";
import { SmallPopover } from "../common/SmallPopover";
import { Spacer } from "../common/Spacer";
import { UserReference } from "../petition-activity/UserReference";

export type PetitionRepliesFieldCommentsProps = {
  petitionId: string;
  field: PetitionRepliesFieldComments_PetitionFieldFragment;
  user: PetitionReplies_UserFragment;
  hasCommentsEnabled: boolean;
  onAddComment: (value: string, internal?: boolean) => void;
  onDeleteComment: (petitionFieldCommentId: string) => void;
  onUpdateComment: (petitionFieldCommentId: string, content: string) => void;
  onClose: () => void;
};

export function PetitionRepliesFieldComments({
  petitionId,
  field,
  user,
  hasCommentsEnabled,
  onAddComment,
  onDeleteComment,
  onUpdateComment,
  onClose,
}: PetitionRepliesFieldCommentsProps) {
  const intl = useIntl();

  const [draft, setDraft] = useState("");
  const [isInternalComment, setInternalComment] = useState(
    hasCommentsEnabled ? false : true
  );
  const [inputFocused, inputFocusBind] = useFocus({ onBlurDelay: 300 });

  const commentsRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when a comment is added
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
    const content = draft.trim();
    if (isMetaReturn(event) && content) {
      event.preventDefault();
      onAddComment(content, isInternalComment);
      setNativeValue(textareaRef.current!, "");
    }
  }

  function handleDraftChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
  }

  function handleSubmitClick() {
    onAddComment(draft.trim(), isInternalComment);
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
          <Text fontWeight="normal" textStyle="hint">
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
              userId={user.id}
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
          >
            {hasCommentsEnabled ? (
              <CommentIcon boxSize="64px" color="gray.200" />
            ) : (
              <Stack alignItems="center" textAlign="center">
                <AlertCircleIcon boxSize="64px" color="gray.200" />
                <Text color="gray.400">
                  <FormattedMessage
                    id="petition-replies.field-comments.disabled-comments-1"
                    defaultMessage="Comments are disabled. Enable them on the petition settings in the <a>Compose</a> tab."
                    values={{
                      a: (chunks: any[]) => (
                        <Link href={`/app/petitions/${petitionId}/compose`}>
                          {chunks}
                        </Link>
                      ),
                    }}
                  />
                </Text>
                {user.hasInternalComments ? (
                  <Text color="gray.400">
                    <FormattedMessage
                      id="petition-replies.field-comments.disabled-comments-2"
                      defaultMessage="Only internal comments will be displayed here."
                    />
                  </Text>
                ) : null}
              </Stack>
            )}
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
          rows={1}
          placeholder={intl.formatMessage({
            id: "petition-replies.field-comments.placeholder",
            defaultMessage: "Type a new comment",
          })}
          isDisabled={!hasCommentsEnabled && !user.hasInternalComments}
          value={draft}
          onKeyDown={handleKeyDown as any}
          onChange={handleDraftChange as any}
          {...inputFocusBind}
        />
        <Collapse in={isExpanded}>
          <Stack
            paddingTop={2}
            direction="row"
            justifyContent={
              user.hasInternalComments ? "space-between" : "flex-end"
            }
          >
            {user.hasInternalComments && (
              <Stack display="flex" alignItems="center" direction="row">
                <Checkbox
                  marginLeft={2}
                  colorScheme="purple"
                  isChecked={isInternalComment}
                  isDisabled={hasCommentsEnabled ? false : true}
                  onChange={() => setInternalComment(!isInternalComment)}
                >
                  <FormattedMessage
                    id="petition-replies.internal-comment-check.label"
                    defaultMessage="Internal comment"
                  />
                </Checkbox>
                <HelpPopover marginLeft={2}>
                  <FormattedMessage
                    id="petition-replies.internal-comment-check.help"
                    defaultMessage="By checking this field, the comment will be visible only to users in your organization."
                  />
                </HelpPopover>
              </Stack>
            )}
            <Stack direction="row">
              <Button size="sm" onClick={handleCancelClick}>
                <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
              </Button>
              <Button
                marginLeft={2}
                size="sm"
                colorScheme="purple"
                isDisabled={draft.trim().length === 0}
                onClick={handleSubmitClick}
              >
                <FormattedMessage id="generic.submit" defaultMessage="Submit" />
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </Box>
    </Card>
  );
}

function FieldComment({
  comment: {
    id,
    author,
    publishedAt,
    isUnread,
    isEdited,
    content: _content,
    isInternal,
  },
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
    if (isMetaReturn(event)) {
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
    onEdit(content.trim());
  }

  function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setContent(event.target.value);
  }

  return (
    <Box
      paddingX={4}
      paddingY={2}
      backgroundColor={
        !publishedAt
          ? "yellow.50"
          : isUnread
          ? "purple.50"
          : isInternal
          ? "gray.50"
          : "white"
      }
    >
      <Box fontSize="sm" display="flex" alignItems="center">
        <Box paddingRight={2}>
          {author?.__typename === "User" && author?.id === userId ? (
            <Text as="strong" fontStyle="italic">
              <FormattedMessage id="generic.you" defaultMessage="You" />
            </Text>
          ) : author?.__typename === "PetitionAccess" ? (
            <ContactLink contact={author.contact} fontWeight="bold" />
          ) : author?.__typename === "User" ? (
            <UserReference user={author} />
          ) : null}
        </Box>
        {isInternal && (
          <SmallPopover
            content={
              <Text fontSize="sm">
                <FormattedMessage
                  id="petition-replies.internal-comment-popover"
                  defaultMessage="This comment is only visible for people in your organization."
                />
              </Text>
            }
          >
            <Badge
              colorScheme="gray"
              variant="outline"
              cursor="default"
              marginRight={2}
            >
              <FormattedMessage
                id="petition-replies.internal-comment.badge"
                defaultMessage="Internal"
              />
            </Badge>
          </SmallPopover>
        )}
        {publishedAt ? (
          <>
            <DateTime
              color="gray.500"
              value={publishedAt}
              format={FORMATS["L+LT"]}
              useRelativeTime
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
            rows={1}
            value={content}
            onKeyDown={handleKeyDown as any}
            onChange={handleContentChange as any}
          />
          <Stack direction="row" justifyContent="flex-end" marginTop={2}>
            <Button size="sm" onClick={handleCancelClick}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
            <Button
              size="sm"
              colorScheme="purple"
              onClick={handleSaveClick}
              isDisabled={content.trim().length === 0}
            >
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
  User: gql`
    fragment PetitionRepliesFieldComments_User on User {
      id
      hasInternalComments: hasFeatureFlag(featureFlag: INTERNAL_COMMENTS)
    }
  `,
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
            ...UserReference_User
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
        isInternal @include(if: $hasInternalComments)
      }
      ${UserReference.fragments.User}
      ${ContactLink.fragments.Contact}
    `;
  },
};
