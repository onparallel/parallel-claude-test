import { Box, Button, HStack, Stack, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { isMetaReturn } from "@parallel/utils/keys";
import { KeyboardEvent, useImperativeHandle, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { HelpPopover } from "../common/HelpPopover";
import { RadioTab, RadioTabList } from "../common/RadioTab";
import {
  CommentEditor,
  CommentEditorInstance,
  CommentEditorProps,
  CommentEditorValue,
  emptyCommentEditorValue,
  isEmptyCommentEditorValue,
} from "../common/slate/CommentEditor";

interface PetitionCommentsAndNotesEditorProps
  extends Pick<CommentEditorProps, "defaultMentionables" | "onSearchMentionables"> {
  id: string;
  onSubmit: (content: CommentEditorValue, isNote: boolean) => Promise<void>;
  tabIsNotes: boolean;
  onTabChange: (tabIsNotes: boolean) => void;
  hasCommentsEnabled: boolean;
  isDisabled: boolean;
  isTemplate: boolean;
}

export interface PetitionCommentsAndNotesEditorInstance {
  focus: () => void;
}

export const PetitionCommentsAndNotesEditor = chakraForwardRef<
  "div",
  PetitionCommentsAndNotesEditorProps,
  PetitionCommentsAndNotesEditorInstance
>(function PetitionCommentsAndNotesEditor(
  {
    id,
    onSubmit,
    defaultMentionables,
    onSearchMentionables,
    hasCommentsEnabled,
    isDisabled,
    isTemplate,
    tabIsNotes,
    onTabChange,
  },
  ref,
) {
  const intl = useIntl();
  const [draft, setDraft] = useState(emptyCommentEditorValue());
  const isEmpty = isEmptyCommentEditorValue(draft);
  const editorRef = useRef<CommentEditorInstance>(null);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        editorRef.current?.focus();
      },
    }),
    [],
  );

  async function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (isMetaReturn(event) && !isTemplate) {
      event.preventDefault();
      handleSubmitClick();
    }
  }

  async function handleSubmitClick() {
    if (!isEmptyCommentEditorValue(draft)) {
      try {
        editorRef.current?.clear();
        await onSubmit(draft, tabIsNotes);
      } catch {}
    }
  }

  return (
    <Box flex="1">
      <RadioTabList
        variant="enclosed"
        name="comments"
        value={tabIsNotes ? "1" : "0"}
        onChange={(value) => onTabChange(value === "1")}
        flex={1}
        minWidth={0}
        marginTop="-1px"
        listStyleType="none"
        position="relative"
      >
        <RadioTab
          value="0"
          borderTopStartRadius={0}
          isDisabled={!hasCommentsEnabled}
          cursor={hasCommentsEnabled ? "pointer" : "not-allowed"}
          color={hasCommentsEnabled ? "inherit" : "gray.400"}
          fontWeight="semibold"
          borderStart="none"
        >
          <FormattedMessage
            id="component.petition-comments-and-notes-editor.comments"
            defaultMessage="Comments"
          />
        </RadioTab>
        <RadioTab
          value="1"
          _checked={{
            color: "blue.600",
            bg: "yellow.100",
            border: "1px solid",
            borderColor: "gray.200",
            borderBottomColor: "transparent",
          }}
          fontWeight="semibold"
          alignItems="center"
        >
          <FormattedMessage
            id="component.petition-comments-and-notes-editor.notes"
            defaultMessage="Notes"
          />
          <HelpPopover>
            <FormattedMessage
              id="component.petition-comments-and-notes-editor.notes-description"
              defaultMessage="Notes are only visible within your organization. You can use them to communicate internally."
            />
          </HelpPopover>
        </RadioTab>
      </RadioTabList>
      <HStack
        padding={2}
        backgroundColor={tabIsNotes ? "yellow.100" : undefined}
        alignItems="flex-start"
      >
        <Stack flex={1} spacing={1} minWidth={0}>
          <CommentEditor
            id={`comment-editor-${id}`}
            ref={editorRef}
            placeholder={
              tabIsNotes
                ? intl.formatMessage({
                    id: "component.petition-comments-and-notes-editor.note-placeholder",
                    defaultMessage: "Type @ to mention other users",
                  })
                : intl.formatMessage({
                    id: "component.petition-comments-and-notes-editor.comment-placeholder",
                    defaultMessage: "Write a comment",
                  })
            }
            value={draft}
            isDisabled={isDisabled}
            onKeyDown={handleKeyDown}
            onChange={setDraft}
            defaultMentionables={defaultMentionables}
            onSearchMentionables={onSearchMentionables}
          />
          <Text fontSize="sm" color="gray.600">
            <FormattedMessage
              id="component.petition-comments-and-notes-editor.ctrl-enter-help"
              defaultMessage="Ctrl + enter to send"
            />
          </Text>
        </Stack>
        <Box>
          <Button
            colorScheme="primary"
            isDisabled={isDisabled || isEmpty || isTemplate}
            onClick={handleSubmitClick}
          >
            <FormattedMessage id="generic.submit" defaultMessage="Submit" />
          </Button>
        </Box>
      </HStack>
    </Box>
  );
});
