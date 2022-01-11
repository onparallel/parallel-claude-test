import { gql } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Spacer,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { MoreVerticalIcon } from "@parallel/chakra/icons";
import {
  FieldComment_PetitionFieldCommentFragment,
  FieldComment_PublicPetitionFieldCommentFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { isMetaReturn } from "@parallel/utils/keys";
import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { UserReference } from "../petition-activity/UserReference";
import { BreakLines } from "./BreakLines";
import { ContactReference } from "./ContactReference";
import { DateTime } from "./DateTime";
import { DeletedContact } from "./DeletedContact";
import { GrowingTextarea } from "./GrowingTextarea";
import { SmallPopover } from "./SmallPopover";

export function FieldComment({
  comment,
  isAuthor,
  onDelete,
  onEdit,
  onMarkAsUnread,
}: {
  comment:
    | FieldComment_PublicPetitionFieldCommentFragment
    | FieldComment_PetitionFieldCommentFragment;
  isAuthor: boolean;
  onDelete: () => void;
  onEdit: (content: string) => void;
  onMarkAsUnread?: () => void;
}) {
  const intl = useIntl();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isInternal = comment.__typename === "PetitionFieldComment" ? comment.isInternal : false;
  const isEdited = comment.__typename === "PetitionFieldComment" ? comment.isEdited : false;

  function handleEditClick() {
    setContent(comment.content);
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
    onEdit(content);
  }

  function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setContent(event.target.value);
  }

  const fullName =
    comment.author?.__typename === "PetitionAccess"
      ? comment.author.contact?.fullName
      : comment?.author?.__typename === "PublicContact" ||
        comment?.author?.__typename === "PublicUser" ||
        comment?.author?.__typename === "User"
      ? comment.author.fullName
      : undefined;

  return (
    <Box
      paddingX={6}
      paddingY={2}
      backgroundColor={comment.isUnread ? "purple.50" : isInternal ? "gray.50" : "white"}
    >
      <Box fontSize="sm" display="flex" alignItems="center">
        <Box paddingRight={2}>
          {isAuthor ? (
            <Text as="strong" fontStyle="italic">
              <FormattedMessage id="generic.you" defaultMessage="You" />
            </Text>
          ) : comment.__typename === "PetitionFieldComment" ? (
            comment.author?.__typename === "PetitionAccess" ? (
              <ContactReference contact={comment.author.contact} fontWeight="bold" />
            ) : comment.author?.__typename === "User" ? (
              <UserReference user={comment.author} />
            ) : (
              <DeletedContact />
            )
          ) : (
            <Text as="strong">{fullName}</Text>
          )}
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
            <Badge colorScheme="gray" variant="outline" cursor="default" marginRight={2}>
              <FormattedMessage
                id="petition-replies.internal-comment.badge"
                defaultMessage="Internal"
              />
            </Badge>
          </SmallPopover>
        )}
        <DateTime color="gray.500" value={comment.createdAt} format={FORMATS.LLL} useRelativeTime />
        {isEdited ? (
          <Text as="span" color="gray.400" marginLeft={2} fontSize="xs">
            <FormattedMessage id="generic.edited-comment-indicator" defaultMessage="Edited" />
          </Text>
        ) : null}
        <Spacer />
        {isAuthor || comment.__typename === "PetitionFieldComment" ? (
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
                {isAuthor ? (
                  <MenuItem onClick={handleEditClick}>
                    <FormattedMessage id="generic.edit" defaultMessage="Edit" />
                  </MenuItem>
                ) : null}
                {!comment.isUnread &&
                ((comment.author?.__typename === "User" && !isAuthor) ||
                  comment.author?.__typename === "PetitionAccess") ? (
                  <MenuItem onClick={onMarkAsUnread}>
                    <FormattedMessage
                      id="component.replies-field-comment.mark-as-unread"
                      defaultMessage="Mark as unread"
                    />
                  </MenuItem>
                ) : null}
                <MenuItem onClick={onDelete}>
                  <FormattedMessage id="generic.delete" defaultMessage="Delete" />
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
          <BreakLines>{content}</BreakLines>
        </Box>
      )}
    </Box>
  );
}

FieldComment.fragments = {
  get PublicPetitionFieldComment() {
    return gql`
      fragment FieldComment_PublicPetitionFieldComment on PublicPetitionFieldComment {
        id
        content
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
          }
        }
      }
    `;
  },
  get PetitionFieldComment() {
    return gql`
      fragment FieldComment_PetitionFieldComment on PetitionFieldComment {
        id
        createdAt
        content
        isUnread
        isInternal
        isEdited
        author {
          ... on User {
            ...UserReference_User
          }
          ... on PetitionAccess {
            id
            contact {
              ...ContactReference_Contact
            }
          }
        }
      }
      ${UserReference.fragments.User}
      ${ContactReference.fragments.Contact}
    `;
  },
};
