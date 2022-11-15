import { Box, Button, HStack, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { isMetaReturn } from "@parallel/utils/keys";
import { KeyboardEvent, useEffect, useImperativeHandle, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { HelpPopover } from "../common/HelpPopover";
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
  hasCommentsEnabled: boolean;
  isDisabled: boolean;
  isTemplate: boolean;
  lastCommentIsNote: boolean;
}

export interface PetitionCommentsAndNotesEditorInstance {
  focusCurrentInput: () => void;
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
    lastCommentIsNote,
  },
  ref
) {
  const intl = useIntl();
  const [isNote, setIsNote] = useState(!hasCommentsEnabled || lastCommentIsNote);
  const [commentDraft, setCommentDraft] = useState(emptyCommentEditorValue());
  const [noteDraft, setNoteDraft] = useState(emptyCommentEditorValue());
  const isCommentEmpty = isEmptyCommentEditorValue(commentDraft);
  const isNoteEmpty = isEmptyCommentEditorValue(noteDraft);

  const commentRef = useRef<CommentEditorInstance>(null);
  const noteRef = useRef<CommentEditorInstance>(null);

  useEffect(() => {
    setIsNote(!hasCommentsEnabled || lastCommentIsNote);
  }, [hasCommentsEnabled, lastCommentIsNote]);

  useImperativeHandle(
    ref,
    () => ({
      focusCurrentInput: () => {
        isNote ? noteRef.current?.focus() : commentRef.current?.focus();
      },
    }),
    [isNote]
  );

  async function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (isMetaReturn(event) && !isTemplate) {
      event.preventDefault();
      handleSubmitClick();
    }
  }

  async function handleSubmitClick() {
    const content = isNote ? noteDraft : commentDraft;
    if (!isEmptyCommentEditorValue(content)) {
      try {
        await onSubmit(content, isNote);
        (isNote ? noteRef : commentRef).current?.clear();
      } catch {}
    }
  }

  return (
    <Box flex="1">
      <Tabs index={isNote ? 1 : 0} onChange={(index) => setIsNote(index === 1)} variant="enclosed">
        <TabList>
          <Tab
            borderTopLeftRadius={0}
            isDisabled={!hasCommentsEnabled}
            cursor={hasCommentsEnabled ? "pointer" : "not-allowed"}
            color={hasCommentsEnabled ? "inherit" : "gray.400"}
            fontWeight="semibold"
            borderLeft="none"
          >
            <FormattedMessage
              id="component.petition-comments-and-notes-editor.comments"
              defaultMessage="Comments"
            />
          </Tab>
          <Tab
            _selected={{
              color: "blue.600",
              bg: "yellow.100",
              border: "1px solid",
              borderColor: "gray.200",
              borderBottomColor: "transparent",
            }}
            fontWeight="semibold"
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
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel
            borderTop="1px solid"
            borderColor="gray.200"
            as={HStack}
            alignItems="flex-start"
            padding={2}
            minHeight="60px"
          >
            <CommentEditor
              id={`comment-editor-${id}`}
              ref={commentRef}
              placeholder={intl.formatMessage({
                id: "component.petition-comments-and-notes-editor.comment-placeholder",
                defaultMessage: "Write a comment",
              })}
              value={commentDraft}
              isDisabled={isDisabled}
              onKeyDown={handleKeyDown}
              onChange={setCommentDraft}
              defaultMentionables={defaultMentionables}
              onSearchMentionables={onSearchMentionables}
            />
            <Box>
              <Button
                colorScheme="primary"
                isDisabled={isDisabled || isCommentEmpty || isTemplate}
                onClick={handleSubmitClick}
              >
                <FormattedMessage id="generic.submit" defaultMessage="Submit" />
              </Button>
            </Box>
          </TabPanel>
          <TabPanel
            backgroundColor="yellow.100"
            borderTop="1px solid"
            borderColor="gray.200"
            as={HStack}
            alignItems="flex-start"
            padding={2}
            justifyContent="flex-end"
            minHeight="60px"
          >
            {isNote ? (
              <>
                <CommentEditor
                  ref={noteRef}
                  id={`note-editor-${id}`}
                  placeholder={intl.formatMessage({
                    id: "component.petition-comments-and-notes-editor.note-placeholder",
                    defaultMessage: "Type @ to mention other users",
                  })}
                  value={noteDraft}
                  isDisabled={isDisabled}
                  onKeyDown={handleKeyDown}
                  onChange={setNoteDraft}
                  defaultMentionables={defaultMentionables}
                  onSearchMentionables={onSearchMentionables}
                />
                <Box>
                  <Button
                    colorScheme="primary"
                    isDisabled={isDisabled || isNoteEmpty || isTemplate}
                    onClick={handleSubmitClick}
                  >
                    <FormattedMessage id="generic.add" defaultMessage="Add" />
                  </Button>
                </Box>
              </>
            ) : null}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
});
