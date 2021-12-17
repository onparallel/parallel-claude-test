import {
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
  Tooltip,
} from "@chakra-ui/react";
import { MoreVerticalIcon } from "@parallel/chakra/icons";
import {
  PreviewPetitionFieldCommentsDialog_PetitionFieldCommentFragment,
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { isMetaReturn } from "@parallel/utils/keys";
import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { BreakLines } from "./BreakLines";
import { DateTime } from "./DateTime";
import { DeletedContact } from "./DeletedContact";
import { GrowingTextarea } from "./GrowingTextarea";

export function FieldComment({
  comment,
  contactId,
  onDelete,
  onEdit,
}: {
  comment:
    | RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment
    | PreviewPetitionFieldCommentsDialog_PetitionFieldCommentFragment;
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
    <Box paddingX={6} paddingY={2} backgroundColor={comment.isUnread ? "purple.50" : "white"}>
      <Box fontSize="sm" display="flex" alignItems="center">
        <Box as="strong" marginRight={2}>
          {fullName ? fullName : <DeletedContact />}
        </Box>

        <DateTime color="gray.500" value={comment.createdAt} format={FORMATS.LLL} useRelativeTime />
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
